import { FastifyPluginAsync } from 'fastify';
import { verifyToken } from '../middleware/auth';
import { sessionService } from '../services/session.service';

const sessionsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', verifyToken);

  fastify.get('/', async (request, reply) => {
    const { userId } = request.user!;
    const sessions = await sessionService.listSessions(userId);
    return reply.send(sessions);
  });

  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { userId } = request.user!;

    try {
      await sessionService.revokeSession(id, userId);
      return reply.send({ success: true });
    } catch (err: any) {
      return reply.status(404).send({ error: err.message });
    }
  });

  fastify.delete('/', async (request, reply) => {
    const { userId } = request.user!;
    // Optionally exclude current session if we can identify it from request.user, but we don't have sessionId in user payload
    await sessionService.revokeAllSessions(userId);
    return reply.send({ success: true });
  });
};

export default sessionsRoutes;
