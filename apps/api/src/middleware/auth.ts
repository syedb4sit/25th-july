import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { UserRole } from '@25th-july/types';

const JWT_ACCESS_SECRET = process.env['JWT_ACCESS_SECRET'] || 'fallback_secret_for_dev';

export interface TokenPayload {
  userId: string;
  role: UserRole;
  iat: number;
  exp: number;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: TokenPayload;
  }
}

export const verifyToken = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return reply.status(401).send({ error: 'Unauthorized: Invalid token format' });
    }

    const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as TokenPayload;
    request.user = decoded;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return reply.status(401).send({ error: 'Unauthorized: Token expired', code: 'TOKEN_EXPIRED' });
    }
    return reply.status(401).send({ error: 'Unauthorized: Invalid token' });
  }
};

