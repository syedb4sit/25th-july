import { prisma } from '../lib/db';
import { EncryptedMessage, SendMessagePayload, EditMessagePayload } from '@25th-july/types';

export const messageService = {
  async getMessages(cursor?: string, limit: number = 50) {
    const messages = await prisma.message.findMany({
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        reactions: true,
        media: true,
        pinnedMessage: true,
      },
    });

    return messages.map(msg => ({
      ...msg,
      isPinned: !!msg.pinnedMessage,
    }));
  },

  async getPinnedMessages() {
    const pinned = await prisma.pinnedMessage.findMany({
      include: {
        message: {
          include: {
            reactions: true,
            media: true,
          }
        }
      },
      orderBy: { pinnedAt: 'desc' }
    });

    return pinned.map(p => ({
      ...p.message,
      isPinned: true,
    }));
  },

  async createMessage(senderId: string, payload: SendMessagePayload) {
    const message = await prisma.message.create({
      data: {
        senderId,
        encryptedContent: payload.encryptedContent,
        encryptedKeySender: payload.encryptedKeySender,
        encryptedKeyRecipient: payload.encryptedKeyRecipient,
        iv: payload.iv,
        signature: payload.signature,
        replyToId: payload.replyToId,
      },
      include: {
        reactions: true,
        media: true,
      }
    });

    return {
      ...message,
      isPinned: false,
    };
  },

  async editMessage(senderId: string, payload: EditMessagePayload) {
    const msg = await prisma.message.findUnique({ where: { id: payload.messageId } });
    if (!msg || msg.senderId !== senderId) {
      throw new Error('Unauthorized or not found');
    }

    const updated = await prisma.message.update({
      where: { id: payload.messageId },
      data: {
        encryptedContent: payload.encryptedContent,
        encryptedKeySender: payload.encryptedKeySender,
        encryptedKeyRecipient: payload.encryptedKeyRecipient,
        iv: payload.iv,
        signature: payload.signature,
        edited: true,
      },
      include: {
        reactions: true,
        media: true,
        pinnedMessage: true,
      }
    });

    return {
      ...updated,
      isPinned: !!updated.pinnedMessage,
    };
  },

  async markDelivered(messageIds: string[]) {
    await prisma.message.updateMany({
      where: { id: { in: messageIds }, deliveredAt: null },
      data: { deliveredAt: new Date() }
    });
  },

  async markRead(messageIds: string[]) {
    await prisma.message.updateMany({
      where: { id: { in: messageIds }, readAt: null },
      data: { readAt: new Date() }
    });
  }
};
