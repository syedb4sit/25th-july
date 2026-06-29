import { FastifyPluginAsync } from 'fastify';
import { verifyToken } from '../middleware/auth';
import { mediaService } from '../services/media.service';
import { z } from 'zod';
import { validateQuery } from '../middleware/validate';
import { MediaType } from '@25th-july/types';
import fs from 'fs';

const mediaRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', verifyToken);

  fastify.post('/upload', async (request, reply) => {
    const data = await request.file({ limits: { fileSize: 100 * 1024 * 1024 } });
    if (!data) {
      return reply.status(400).send({ error: 'No file uploaded' });
    }

    const messageId = (data.fields as any).messageId?.value;
    const encryptedKeySender = (data.fields as any).encryptedKeySender?.value;
    const encryptedKeyRecipient = (data.fields as any).encryptedKeyRecipient?.value;
    const iv = (data.fields as any).iv?.value;
    const type = (data.fields as any).type?.value as MediaType;
    const mimeType = (data.fields as any).mimeType?.value || data.mimetype;
    const originalName = data.filename;

    if (!messageId || !encryptedKeySender || !encryptedKeyRecipient || !iv || !type) {
      return reply.status(400).send({ error: 'Missing metadata fields' });
    }

    const payload = {
      messageId,
      encryptedKeySender,
      encryptedKeyRecipient,
      iv,
      type,
      mimeType,
      originalName
    };

    const media = await mediaService.uploadMedia(payload, data.file);
    return reply.send(media);
  });

  const listQuerySchema = z.object({
    type: z.enum(['IMAGE', 'VIDEO', 'VOICE', 'DOCUMENT']).optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(50),
  });

  fastify.get('/list', { preHandler: [validateQuery(listQuerySchema)] }, async (request, reply) => {
    const { type, page, limit } = request.query as z.infer<typeof listQuerySchema>;
    const result = await mediaService.listMedia(type as MediaType | undefined, page, limit);
    return reply.send(result);
  });

  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const media = await mediaService.getMedia(id);
      const stream = fs.createReadStream(media.encryptedBlobUrl);
      reply.type('application/octet-stream');
      return reply.send(stream);
    } catch (err: any) {
      return reply.status(404).send({ error: err.message });
    }
  });
};

export default mediaRoutes;
