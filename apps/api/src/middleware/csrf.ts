import { FastifyRequest, FastifyReply } from 'fastify';

export const csrfProtection = async (request: FastifyRequest, reply: FastifyReply) => {
  // Only apply to state-changing methods
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    const customHeader = request.headers['x-25thjuly-request'];
    
    if (!customHeader || customHeader !== 'true') {
      return reply.status(403).send({ error: 'Forbidden: Missing CSRF header' });
    }
  }
};
