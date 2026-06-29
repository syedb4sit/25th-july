import { prisma } from '../lib/db';
import * as argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { emailService } from './email.service';
import { auditService } from './audit.service';
import { UserRole } from '@25th-july/types';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'fallback_secret_for_dev';

export const authService = {
  async registerUser(email: string, passwordHash: string, displayName: string, ipMasked?: string) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Hash the (already client-side pre-hashed) password with Argon2id
    const serverHash = await argon2.hash(passwordHash, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3,
      parallelism: 4,
    });

    // Make the first registered user OWNER, second PARTNER. Throw error if 3rd tries to register.
    const userCount = await prisma.user.count();
    if (userCount >= 2) {
      throw new Error('Registration closed. Maximum of 2 users allowed.');
    }
    const role: UserRole = userCount === 0 ? 'OWNER' : 'PARTNER';

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: serverHash,
        displayName,
        role,
      },
    });

    // Generate verification token (simple implementation)
    const verificationToken = crypto.randomBytes(32).toString('hex');
    // In a real app, store token in DB with expiry. For v1 demo, maybe we auto-verify or use simple Redis token.
    // Let's assume auto-verify or simple token logic.
    await emailService.sendVerificationEmail(email, verificationToken);

    await auditService.logEvent(user.id, 'DEVICE_REGISTERED', ipMasked);

    return user;
  },

  async loginUser(email: string, passwordHash: string, deviceId: string | null, ipMasked?: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValid = await argon2.verify(user.passwordHash, passwordHash);
    if (!isValid) {
      await auditService.logEvent(user.id, 'LOGIN_FAILURE', ipMasked, deviceId);
      throw new Error('Invalid credentials');
    }

    // Generate tokens
    const { accessToken, refreshToken, refreshTokenHash } = this.generateTokens(user.id, user.role as UserRole);

    // Create session
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    await prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash,
        deviceId,
        ipMasked,
        expiresAt,
      },
    });

    await auditService.logEvent(user.id, 'LOGIN_SUCCESS', ipMasked, deviceId);

    return { user, accessToken, refreshToken };
  },

  async refreshTokens(oldRefreshToken: string, ipMasked?: string) {
    const oldHash = this.hashRefreshToken(oldRefreshToken);

    const session = await prisma.session.findFirst({
      where: { refreshTokenHash: oldHash },
      include: { user: true },
    });

    if (!session) {
      // Possible token reuse attack, or just invalid token
      throw new Error('Invalid refresh token');
    }

    if (session.revoked || session.expiresAt < new Date()) {
      // Token reuse! Invalidate ALL sessions for this user.
      await prisma.session.updateMany({
        where: { userId: session.userId },
        data: { revoked: true },
      });
      await auditService.logEvent(session.userId, 'FORCE_LOGOUT', ipMasked, session.deviceId, { reason: 'Token reuse detected' });
      throw new Error('Session revoked due to token reuse');
    }

    // Rotate token
    const { accessToken, refreshToken, refreshTokenHash } = this.generateTokens(session.userId, session.user.role as UserRole);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Delete old session, create new
    await prisma.$transaction([
      prisma.session.delete({ where: { id: session.id } }),
      prisma.session.create({
        data: {
          userId: session.userId,
          refreshTokenHash,
          deviceId: session.deviceId,
          ipMasked,
          expiresAt,
        },
      }),
    ]);

    return { accessToken, refreshToken };
  },

  async logout(refreshToken: string) {
    const hash = this.hashRefreshToken(refreshToken);
    await prisma.session.deleteMany({
      where: { refreshTokenHash: hash },
    });
  },

  generateTokens(userId: string, role: UserRole) {
    const accessToken = jwt.sign({ userId, role }, JWT_ACCESS_SECRET, { expiresIn: '15m' });
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const refreshTokenHash = this.hashRefreshToken(refreshToken);
    return { accessToken, refreshToken, refreshTokenHash };
  },

  hashRefreshToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  },

  maskIp(ip: string) {
    if (!ip) return null;
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.x`;
    }
    return 'hidden';
  }
};
