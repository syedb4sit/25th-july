import { FastifyInstance } from 'fastify';
import { WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { TokenPayload } from '../middleware/auth';
import { logger } from '../lib/logger';
import { handleWebSocketMessage } from './handlers';
import { redis } from '../lib/redis';

const JWT_ACCESS_SECRET = process.env['JWT_ACCESS_SECRET'] || 'fallback_secret_for_dev';

export const connectedClients = new Map<string, WebSocket>();

export const setupWebSocketServer = (fastify: FastifyInstance) => {
  fastify.get('/ws', { websocket: true }, (connection, req) => {
    let userId: string | null = null;
    const socket = connection.socket;

    try {
      // Authenticate via query param (token)
      const token = (req.query as any).token;
      if (!token) {
        socket.close(4001, 'Unauthorized: No token');
        return;
      }

      const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as TokenPayload;
      userId = decoded.userId;

      // Register connection
      connectedClients.set(userId, socket);
      logger.info(`WebSocket connected: User ${userId}`);

      // Set online status in Redis
      redis.set(`presence:${userId}`, 'online');
      
      // Notify partner
      broadcastToPartner(userId, { type: 'presence:update', payload: { userId, status: 'online', lastSeen: new Date().toISOString() } });

      socket.on('message', async (message: Buffer) => {
        try {
          // Re-verify token on every message for max security? Or rely on connection?
          // For performance, we rely on connection but handle JWT expiry gracefully.
          // In a real strict implementation, we might parse the token from the payload again.
          const data = JSON.parse(message.toString());
          await handleWebSocketMessage(userId!, data);
        } catch (err: any) {
          logger.error(`WebSocket message error from ${userId}:`, err);
          socket.send(JSON.stringify({ type: 'error', payload: err.message }));
        }
      });

      socket.on('close', () => {
        if (userId) {
          connectedClients.delete(userId);
          redis.set(`presence:${userId}`, new Date().toISOString()); // Set lastSeen
          broadcastToPartner(userId, { type: 'presence:update', payload: { userId, status: 'offline', lastSeen: new Date().toISOString() } });
          logger.info(`WebSocket disconnected: User ${userId}`);
        }
      });

    } catch (err) {
      logger.error('WebSocket connection error:', err);
      socket.close(4001, 'Unauthorized');
    }
  });
};

export const broadcastToPartner = async (senderId: string, event: any) => {
  const { prisma } = await import('../lib/db');
  const partner = await prisma.user.findFirst({ where: { id: { not: senderId } } });
  
  if (partner) {
    const partnerSocket = connectedClients.get(partner.id);
    if (partnerSocket && partnerSocket.readyState === WebSocket.OPEN) {
      partnerSocket.send(JSON.stringify(event));
    }
  }
};

