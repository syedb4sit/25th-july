import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import fastifyRateLimit from '@fastify/rate-limit';
import { redis } from '../lib/redis';

const rateLimiter: FastifyPluginAsync = async (fastify) => {
  const isEnabled = process.env.RATE_LIMIT_ENABLED === 'true';

  if (!isEnabled) {
    fastify.log.warn('Rate limiting is DISABLED via env variables');
    return;
  }

  await fastify.register(fastifyRateLimit, {
    redis,
    global: false, // We apply limits specifically per route
    errorResponseBuilder: (request, context) => {
      return {
        statusCode: 429,
        error: 'Too Many Requests',
        message: `Rate limit exceeded, retry in ${context.after}`,
        date: Date.now(),
        expiresIn: context.after
      };
    }
  });
};

export default fp(rateLimiter);

// Export limit configs to use on specific routes
export const rateLimits = {
  login: { max: 5, timeWindow: '15 minutes' },
  register: { max: 3, timeWindow: '1 hour' },
  passwordReset: { max: 3, timeWindow: '1 hour' },
  messages: { max: 120, timeWindow: '1 minute' },
  media: { max: 20, timeWindow: '1 minute' },
  general: { max: 300, timeWindow: '1 minute' },
};
