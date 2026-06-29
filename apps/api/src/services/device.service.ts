import { prisma } from '../lib/db';
import crypto from 'crypto';
import { emailService } from './email.service';
import { auditService } from './audit.service';

export const deviceService = {
  async registerDevice(userId: string, fingerprintHash: string, browser?: string, os?: string) {
    const existing = await prisma.device.findFirst({
      where: { userId, fingerprintHash }
    });

    if (existing) {
      return existing;
    }

    const approvalToken = crypto.randomBytes(32).toString('hex');
    const approvalExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    const device = await prisma.device.create({
      data: {
        userId,
        name: `${browser || 'Unknown'} on ${os || 'Unknown'}`,
        fingerprintHash,
        browser,
        os,
        trusted: false,
        approvalToken,
        approvalExpires,
      }
    });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      await emailService.sendDeviceApprovalEmail(user.email, { browser, os }, approvalToken);
    }

    return device;
  },

  async approveDevice(token: string) {
    const device = await prisma.device.findFirst({
      where: { 
        approvalToken: token,
        approvalExpires: { gt: new Date() }
      }
    });

    if (!device) {
      throw new Error('Invalid or expired approval token');
    }

    const deviceSecret = crypto.randomBytes(32).toString('hex');

    const updated = await prisma.device.update({
      where: { id: device.id },
      data: {
        trusted: true,
        approvalToken: null,
        approvalExpires: null,
        deviceSecret,
      }
    });

    await auditService.logEvent(device.userId, 'DEVICE_APPROVED', null, device.id);

    return updated;
  },

  async revokeDevice(deviceId: string, userId: string) {
    const device = await prisma.device.findUnique({ where: { id: deviceId } });
    if (!device || device.userId !== userId) {
      throw new Error('Device not found');
    }

    await prisma.$transaction([
      prisma.device.update({
        where: { id: deviceId },
        data: {
          trusted: false,
          deviceSecret: null,
        }
      }),
      prisma.session.updateMany({
        where: { deviceId },
        data: { revoked: true }
      })
    ]);

    await auditService.logEvent(userId, 'DEVICE_REVOKED', null, deviceId);
  },

  async listDevices(userId: string) {
    return prisma.device.findMany({
      where: { userId },
      orderBy: { lastLogin: 'desc' }
    });
  }
};
