import { FastifyPluginAsync } from 'fastify';
import { verifyToken } from '../middleware/auth';
import { z } from 'zod';
import { validateBody } from '../middleware/validate';
import { prisma } from '../lib/db';
import * as argon2 from 'argon2';
import { auditService } from '../services/audit.service';

const settingsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', verifyToken);

  const profileSchema = z.object({
    displayName: z.string().min(1).max(50).optional(),
    avatarUrl: z.string().url().optional().nullable(),
  });

  fastify.put('/profile', { preHandler: [validateBody(profileSchema)] }, async (request, reply) => {
    const { displayName, avatarUrl } = request.body as z.infer<typeof profileSchema>;
    const { userId } = request.user!;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(displayName !== undefined && { displayName }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      }
    });

    return reply.send({ success: true, displayName: updated.displayName, avatarUrl: updated.avatarUrl });
  });

  const passwordSchema = z.object({
    currentPasswordHash: z.string().min(64),
    newPasswordHash: z.string().min(64),
  });

  fastify.put('/password', { preHandler: [validateBody(passwordSchema)] }, async (request, reply) => {
    const { currentPasswordHash, newPasswordHash } = request.body as z.infer<typeof passwordSchema>;
    const { userId } = request.user!;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return reply.status(404).send({ error: 'User not found' });

    const isValid = await argon2.verify(user.passwordHash, currentPasswordHash);
    if (!isValid) {
      return reply.status(400).send({ error: 'Incorrect current password' });
    }

    const serverHash = await argon2.hash(newPasswordHash, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: serverHash }
    });

    await auditService.logEvent(userId, 'PASSWORD_CHANGE', null);

    return reply.send({ success: true });
  });
};

export default settingsRoutes;
