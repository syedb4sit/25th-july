import { FastifyPluginAsync } from 'fastify';
import { verifyToken } from '../middleware/auth';
import { z } from 'zod';
import { validateBody } from '../middleware/validate';

const keysRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', verifyToken);

  const uploadSchema = z.object({
    publicKey: z.string(),
    identityKey: z.string(),
  });

  fastify.post('/upload', { preHandler: [validateBody(uploadSchema)] }, async (request, reply) => {
    const { publicKey, identityKey } = request.body as z.infer<typeof uploadSchema>;
    const { userId } = request.user!;

    const { prisma } = await import('../lib/db');
    await prisma.user.update({
      where: { id: userId },
      data: { publicKey, identityKey }
    });

    return reply.send({ success: true });
  });

  fastify.get('/partner', async (request, reply) => {
    const { userId } = request.user!;
    const { prisma } = await import('../lib/db');
    
    // Find the other user (since there are only 2 users)
    const partner = await prisma.user.findFirst({
      where: { id: { not: userId } },
      select: { publicKey: true, identityKey: true }
    });

    if (!partner) {
      return reply.status(404).send({ error: 'Partner not found' });
    }

    return reply.send(partner);
  });
};

export default keysRoutes;
