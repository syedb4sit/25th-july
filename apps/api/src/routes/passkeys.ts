import { FastifyPluginAsync } from 'fastify';
import { verifyToken } from '../middleware/auth';
import { z } from 'zod';
import { validateBody } from '../middleware/validate';
import { 
  generateRegistrationOptions, 
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} from '@simplewebauthn/server';
import { prisma } from '../lib/db';
import { authService } from '../services/auth.service';
import { UserRole } from '@25th-july/types';

const rpName = process.env['WEBAUTHN_RP_NAME'] || '25th July';
const rpID = process.env['WEBAUTHN_RP_ID'] || 'localhost';
const origin = process.env['WEBAUTHN_ORIGIN'] || 'http://localhost:3000';

// In-memory store for challenges (use Redis in prod)
const currentChallenges: Record<string, string> = {};

const passkeysRoutes: FastifyPluginAsync = async (fastify) => {

  // --- Registration (Protected) ---
  fastify.post('/register/options', { preHandler: [verifyToken] }, async (request, reply) => {
    const { userId } = request.user!;
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { passkeys: true } });
    if (!user) return reply.status(404).send({ error: 'User not found' });

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: user.id,
      userName: user.email,
      attestationType: 'none',
      excludeCredentials: user.passkeys.map((pk: any) => ({
        id: pk.credentialId,
        type: 'public-key',
      })),
    });

    currentChallenges[userId] = options.challenge;
    return reply.send(options);
  });

  fastify.post('/register/verify', { preHandler: [verifyToken] }, async (request, reply) => {
    const { userId } = request.user!;
    const body = request.body as any;
    const expectedChallenge = currentChallenges[userId];

    if (!expectedChallenge) {
      return reply.status(400).send({ error: 'No challenge found for user' });
    }

    try {
      const verification = await verifyRegistrationResponse({
        response: body,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
      });

      if (verification.verified && verification.registrationInfo) {
        const { credentialID, credentialPublicKey, counter, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

        await prisma.passkey.create({
          data: {
            userId,
            credentialId: credentialID as unknown as string,
            publicKey: Buffer.from(credentialPublicKey).toString('base64'),
            counter,
            transports: body.response.transports || [],
            name: "Passkey"
          }
        });

        delete currentChallenges[userId];
        return reply.send({ verified: true });
      }
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  // --- Authentication (Public) ---
  const authOptionsSchema = z.object({
    email: z.string().email(),
  });

  fastify.post('/login/options', { preHandler: [validateBody(authOptionsSchema)] }, async (request, reply) => {
    const { email } = request.body as z.infer<typeof authOptionsSchema>;
    const user = await prisma.user.findUnique({ where: { email }, include: { passkeys: true } });
    
    if (!user || user.passkeys.length === 0) {
      return reply.status(404).send({ error: 'No passkeys registered for this user' });
    }

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: user.passkeys.map((pk: any) => ({
        id: Buffer.from(pk.credentialId, 'base64'),
        type: 'public-key',
        transports: pk.transports as any,
      })),
    });

    currentChallenges[user.id] = options.challenge;
    return reply.send({ options, userId: user.id });
  });

  const authVerifySchema = z.object({
    userId: z.string(),
    response: z.any(),
  });

  fastify.post('/login/verify', { preHandler: [validateBody(authVerifySchema)] }, async (request, reply) => {
    const { userId, response } = request.body as z.infer<typeof authVerifySchema>;
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { passkeys: true } });
    const expectedChallenge = currentChallenges[userId];

    if (!user || !expectedChallenge) {
      return reply.status(400).send({ error: 'Invalid state' });
    }

    const passkey = user.passkeys.find((pk: any) => pk.credentialId === response.id);
    if (!passkey) {
      return reply.status(400).send({ error: 'Passkey not found' });
    }

    try {
      const verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        authenticator: {
          credentialID: Buffer.from(passkey.credentialId, 'base64'),
          credentialPublicKey: Buffer.from(passkey.publicKey, 'base64'),
          counter: Number(passkey.counter),
        }
      });

      if (verification.verified) {
        await prisma.passkey.update({
          where: { id: passkey.id },
          data: { counter: BigInt(verification.authenticationInfo.newCounter) }
        });
        delete currentChallenges[userId];

        // Login success, issue tokens
        const ipMasked = authService.maskIp(request.ip);
        const deviceId = request.cookies['deviceId'] || null;

        const { accessToken, refreshToken, refreshTokenHash } = authService.generateTokens(user.id, user.role as UserRole);

        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await prisma.session.create({
          data: {
            userId: user.id,
            refreshTokenHash,
            deviceId,
            ipMasked,
            expiresAt,
          },
        });

        reply.setCookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: process.env['NODE_ENV'] === 'production',
          sameSite: 'strict',
          path: '/api/auth',
          maxAge: 30 * 24 * 60 * 60,
        });

        return reply.send({
          user: {
            id: user.id,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
            publicKey: user.publicKey,
            identityKey: user.identityKey,
            role: user.role,
          },
          accessToken,
        });
      }
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  // --- Management (Protected) ---
  fastify.get('/', { preHandler: [verifyToken] }, async (request, reply) => {
    const { userId } = request.user!;
    const passkeys = await prisma.passkey.findMany({ where: { userId } });
    return reply.send(passkeys);
  });

  fastify.delete('/:id', { preHandler: [verifyToken] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { userId } = request.user!;
    
    await prisma.passkey.deleteMany({ where: { id, userId } });
    return reply.send({ success: true });
  });

};

export default passkeysRoutes;

