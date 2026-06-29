import { FastifyPluginAsync } from 'fastify';
import { verifyToken } from '../middleware/auth';
import { deviceService } from '../services/device.service';
import { z } from 'zod';
import { validateBody } from '../middleware/validate';

const devicesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/approve/:token', async (request, reply) => {
    const { token } = request.params as { token: string };
    try {
      const device = await deviceService.approveDevice(token);
      return reply.send({ success: true, deviceId: device.id, deviceSecret: device.deviceSecret });
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  // Protect all routes below
  fastify.addHook('preHandler', verifyToken);

  fastify.get('/', async (request, reply) => {
    const { userId } = request.user!;
    const devices = await deviceService.listDevices(userId);
    return reply.send(devices);
  });

  const renameSchema = z.object({
    name: z.string().min(1).max(100),
  });

  fastify.put('/:id/name', { preHandler: [validateBody(renameSchema)] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { name } = request.body as z.infer<typeof renameSchema>;
    const { userId } = request.user!;

    const { prisma } = await import('../lib/db');
    const device = await prisma.device.findUnique({ where: { id } });
    
    if (!device || device.userId !== userId) {
      return reply.status(404).send({ error: 'Device not found' });
    }

    const updated = await prisma.device.update({
      where: { id },
      data: { name }
    });

    return reply.send(updated);
  });

  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { userId } = request.user!;

    try {
      await deviceService.revokeDevice(id, userId);
      return reply.send({ success: true });
    } catch (err: any) {
      return reply.status(404).send({ error: err.message });
    }
  });
};

export default devicesRoutes;
