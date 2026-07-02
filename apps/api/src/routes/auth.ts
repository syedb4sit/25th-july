import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { validateBody } from '../middleware/validate';
import { authService } from '../services/auth.service';
import { rateLimits } from '../middleware/rate-limit';
import { verifyToken } from '../middleware/auth';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  const registerSchema = z.object({
    email: z.string().email(),
    passwordHash: z.string().min(64), // Assuming SHA-256 hex
    displayName: z.string().min(1).max(50),
  });

  const loginSchema = z.object({
    email: z.string().email(),
    passwordHash: z.string().min(64),
  });

  fastify.post('/register', {
    config: { rateLimit: rateLimits.register },
    preHandler: [validateBody(registerSchema)]
  }, async (request, reply) => {
    const { email, passwordHash, displayName } = request.body as z.infer<typeof registerSchema>;
    const ipMasked = authService.maskIp(request.ip);

    try {
      const user = await authService.registerUser(email, passwordHash, displayName, ipMasked || undefined);
      return reply.send({ success: true, userId: user.id });
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.post('/login', {
    config: { rateLimit: rateLimits.login },
    preHandler: [validateBody(loginSchema)]
  }, async (request, reply) => {
    const { email, passwordHash } = request.body as z.infer<typeof loginSchema>;
    const ipMasked = authService.maskIp(request.ip);
    // In a real flow, deviceId would be extracted from a secure cookie set during device approval
    const deviceId = request.cookies['deviceId'] || null;

    try {
      const { user, accessToken, refreshToken } = await authService.loginUser(email, passwordHash, deviceId, ipMasked || undefined);
      
      reply.setCookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env['NODE_ENV'] === 'production',
        sameSite: 'strict',
        path: '/api/auth',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });

      return reply.send({
        user: {
          id: user.id,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          publicKey: user.publicKey,
          identityKey: user.identityKey,
          role: user.role,
        },
        accessToken,
      });
    } catch (err: any) {
      return reply.status(401).send({ error: err.message });
    }
  });

  fastify.post('/refresh', async (request, reply) => {
    const refreshToken = request.cookies['refreshToken'];
    if (!refreshToken) {
      return reply.status(401).send({ error: 'No refresh token' });
    }

    const ipMasked = authService.maskIp(request.ip);

    try {
      const { accessToken, refreshToken: newRefreshToken } = await authService.refreshTokens(refreshToken, ipMasked || undefined);
      
      reply.setCookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env['NODE_ENV'] === 'production',
        sameSite: 'strict',
        path: '/api/auth',
        maxAge: 30 * 24 * 60 * 60,
      });

      return reply.send({ accessToken });
    } catch (err: any) {
      reply.clearCookie('refreshToken', { path: '/api/auth' });
      return reply.status(401).send({ error: err.message });
    }
  });

  fastify.post('/logout', async (request, reply) => {
    const refreshToken = request.cookies['refreshToken'];
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
    reply.clearCookie('refreshToken', { path: '/api/auth' });
    return reply.send({ success: true });
  });

  fastify.get('/me', { preHandler: [verifyToken] }, async (request, reply) => {
    const { userId } = request.user!;
    const { prisma } = await import('../lib/db');
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    return reply.send({
      id: user.id,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      publicKey: user.publicKey,
      identityKey: user.identityKey,
      role: user.role,
    });
  });
};

export default authRoutes;

