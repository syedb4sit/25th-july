import fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import websocket from '@fastify/websocket';
import fastifyStatic from '@fastify/static';
import path from 'path';

import { logger } from './lib/logger';
import securityHeaders from './middleware/security-headers';
import rateLimiter from './middleware/rate-limit';

import authRoutes from './routes/auth';
import messagesRoutes from './routes/messages';
import mediaRoutes from './routes/media';
import keysRoutes from './routes/keys';
import devicesRoutes from './routes/devices';
import sessionsRoutes from './routes/sessions';
import passkeysRoutes from './routes/passkeys';
import settingsRoutes from './routes/settings';

import { setupWebSocketServer } from './websocket/server';

const app = fastify({ logger: logger as any });

const start = async () => {
  try {
    // Basic plugins
    await app.register(cors, {
      origin: process.env['APP_URL'] || 'http://localhost:3000',
      credentials: true,
    });
    await app.register(helmet);
    await app.register(cookie);
    await app.register(multipart, {
      limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
    });
    await app.register(websocket);

    // Custom middleware
    await app.register(securityHeaders);
    await app.register(rateLimiter);

    // Routes
    await app.register(authRoutes, { prefix: '/api/auth' });
    await app.register(messagesRoutes, { prefix: '/api/messages' });
    await app.register(mediaRoutes, { prefix: '/api/media' });
    await app.register(keysRoutes, { prefix: '/api/keys' });
    await app.register(devicesRoutes, { prefix: '/api/devices' });
    await app.register(sessionsRoutes, { prefix: '/api/sessions' });
    await app.register(passkeysRoutes, { prefix: '/api/passkeys' });
    await app.register(settingsRoutes, { prefix: '/api/settings' });

    // WebSocket Server
    setupWebSocketServer(app as any);

    // Cron Jobs
    // None currently configured

    // Serve static files in production
    if (process.env['NODE_ENV'] === 'production') {
      await app.register(fastifyStatic, {
        root: path.join(__dirname, '../../web/.next'),
        prefix: '/',
      });
    }

    const port = parseInt(process.env['PORT'] || '3001', 10);
    await app.listen({ port, host: '0.0.0.0' });
    
    app.log.info(`Server listening on port ${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();

