import { prisma } from '../lib/db';
import { MediaUploadPayload, MediaType } from '@25th-july/types';
import fs from 'fs/promises';
import path from 'path';

const MEDIA_STORAGE_PATH = process.env['MEDIA_STORAGE_PATH'] || './data/media';

export const mediaService = {
  async uploadMedia(payload: MediaUploadPayload, blobStream: AsyncIterable<Buffer>) {
    // Ensure storage directory exists
    await fs.mkdir(MEDIA_STORAGE_PATH, { recursive: true });

    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.enc`;
    const filepath = path.join(MEDIA_STORAGE_PATH, filename);

    // Save encrypted blob to disk
    const fileHandle = await fs.open(filepath, 'w');
    for await (const chunk of blobStream) {
      await fileHandle.write(chunk);
    }
    await fileHandle.close();

    const stat = await fs.stat(filepath);

    // Record in DB
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const media = await prisma.media.create({
      data: {
        messageId: payload.messageId,
        encryptedBlobUrl: filepath,
        encryptedKeySender: payload.encryptedKeySender,
        encryptedKeyRecipient: payload.encryptedKeyRecipient,
        iv: payload.iv,
        type: payload.type,
        mimeType: payload.mimeType,
        sizeBytes: stat.size,
        originalName: payload.originalName.replace(/[^a-zA-Z0-9.-]/g, '_'), // Sanitise
        expiresAt,
      }
    });

    return media;
  },

  async getMedia(id: string) {
    const media = await prisma.media.findUnique({ where: { id } });
    if (!media || media.expired) {
      throw new Error('Media not found or expired');
    }
    return media;
  },

  async listMedia(type?: MediaType, page: number = 1, limit: number = 50) {
    const where = type ? { type, expired: false } : { expired: false };
    
    const [total, items] = await prisma.$transaction([
      prisma.media.count({ where }),
      prisma.media.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { uploadedAt: 'desc' },
      })
    ]);

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
};

