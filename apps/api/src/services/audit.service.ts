import { prisma } from '../lib/db';
import { logger } from '../lib/logger';


export const auditService = {
  async logEvent(
    userId: string,
    eventType: string,
    ipMasked?: string | null,
    deviceId?: string | null,
    metadata?: any
  ) {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          eventType,
          ipMasked,
          deviceId,
          metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined, // Ensure valid JSON
        },
      });
      logger.info(`Audit Event: ${eventType} by User ${userId}`);
    } catch (error) {
      logger.error(`Failed to log audit event ${eventType} for User ${userId}`, error);
    }
  }
};
