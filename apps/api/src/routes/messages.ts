import { FastifyPluginAsync } from 'fastify';
import { verifyToken } from '../middleware/auth';
import { messageService } from '../services/message.service';
import { z } from 'zod';
import { validateQuery } from '../middleware/validate';

const messagesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', verifyToken);

  const getQuerySchema = z.object({
    cursor: z.string().uuid().optional(),
    limit: z.coerce.number().min(1).max(100).default(50),
  });

  fastify.get('/', { preHandler: [validateQuery(getQuerySchema)] }, async (request, reply) => {
    const { cursor, limit } = request.query as z.infer<typeof getQuerySchema>;
    const messages = await messageService.getMessages(cursor, limit);
    return reply.send(messages);
  });

  fastify.get('/pinned', async (request, reply) => {
    const pinned = await messageService.getPinnedMessages();
    return reply.send(pinned);
  });

  fastify.post('/pin/:messageId', async (request, reply) => {
    const { messageId } = request.params as { messageId: string };
    const { userId } = request.user!;
    
    const { prisma } = await import('../lib/db');
    await prisma.pinnedMessage.create({
      data: { messageId, pinnedBy: userId }
    });
    
    return reply.send({ success: true });
  });

  fastify.delete('/pin/:messageId', async (request, reply) => {
    const { messageId } = request.params as { messageId: string };
    
    const { prisma } = await import('../lib/db');
    await prisma.pinnedMessage.delete({
      where: { messageId }
    });
    
    return reply.send({ success: true });
  });
};

export default messagesRoutes;
