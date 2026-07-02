import { Resend } from 'resend';
import { logger } from '../lib/logger';

const resendApiKey = process.env['RESEND_API_KEY'];
const emailFrom = process.env['EMAIL_FROM'] || 'noreply@developedbybasit.me';

let resend: Resend | null = null;
if (resendApiKey) {
  resend = new Resend(resendApiKey);
} else {
  logger.warn('RESEND_API_KEY is not set. Emails will be logged to console in dev mode.');
}

export const emailService = {
  async sendVerificationEmail(email: string, token: string) {
    const link = `${process.env['APP_URL']}/verify-email?token=${token}`;
    const subject = 'Verify your email - 25th July';
    const html = `
      <h1>Welcome to 25th July</h1>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${link}">Verify Email</a>
      <p>This link expires in 24 hours.</p>
    `;

    return this.sendEmail(email, subject, html);
  },

  async sendPasswordResetEmail(email: string, token: string) {
    const link = `${process.env['APP_URL']}/reset-password?token=${token}`;
    const subject = 'Reset your password - 25th July';
    const html = `
      <h1>Password Reset Request</h1>
      <p>You requested to reset your password. Click the link below to set a new password:</p>
      <a href="${link}">Reset Password</a>
      <p>This link expires in 15 minutes.</p>
    `;

    return this.sendEmail(email, subject, html);
  },

  async sendDeviceApprovalEmail(email: string, deviceInfo: any, token: string) {
    const link = `${process.env['APP_URL']}/approve-device?token=${token}`;
    const subject = 'New Device Login Attempt - 25th July';
    const html = `
      <h1>New Device Login Request</h1>
      <p>An unknown device is trying to log into your account.</p>
      <ul>
        <li>Browser: ${deviceInfo.browser || 'Unknown'}</li>
        <li>OS: ${deviceInfo.os || 'Unknown'}</li>
      </ul>
      <p>If this was you, please approve the device by clicking the link below:</p>
      <a href="${link}">Approve Device</a>
      <p>This link expires in 10 minutes. If this wasn't you, ignore this email.</p>
    `;

    return this.sendEmail(email, subject, html);
  },

  async sendEmail(to: string, subject: string, html: string) {
    if (resend) {
      try {
        await resend.emails.send({
          from: emailFrom,
          to,
          subject,
          html,
        });
        logger.info(`Email sent to ${to}: ${subject}`);
      } catch (error) {
        logger.error('Failed to send email via Resend', error);
      }
    } else {
      logger.info('--- MOCK EMAIL ---');
      logger.info(`To: ${to}`);
      logger.info(`Subject: ${subject}`);
      logger.info(`Body:\n${html}`);
      logger.info('------------------');
    }
  }
};

