import { prisma } from '../lib/db';
import { auditService } from './audit.service';

export const sessionService = {
  async listSessions(userId: string) {
    return prisma.session.findMany({
      where: { 
        userId,
        revoked: false,
        expiresAt: { gt: new Date() }
      },
      include: {
        device: {
          select: { name: true, browser: true, os: true }
        }
      },
      orderBy: { lastUsedAt: 'desc' }
    });
  },

  async revokeSession(sessionId: string, userId: string) {
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== userId) {
      throw new Error('Session not found');
    }

    await prisma.session.update({
      where: { id: sessionId },
      data: { revoked: true }
    });

    await auditService.logEvent(userId, 'SESSION_TERMINATED', null, session.deviceId);
  },

  async revokeAllSessions(userId: string, excludeSessionId?: string) {
    await prisma.session.updateMany({
      where: { 
        userId,
        id: excludeSessionId ? { not: excludeSessionId } : undefined
      },
      data: { revoked: true }
    });

    await auditService.logEvent(userId, 'FORCE_LOGOUT', null);
  }
};
