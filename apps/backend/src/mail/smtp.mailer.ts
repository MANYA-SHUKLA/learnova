import { createId } from '@learnova/utils';
import { env } from '../config/env.js';
import { logger } from '../utils/logger/index.js';
import { AppError } from '../utils/errors/index.js';
import type { IMailer, SendMailInput, SendMailResult } from './types.js';

/**
 * SMTP mailer — Gmail / generic SMTP via nodemailer.
 * Port 587 + SMTP_SECURE=false uses STARTTLS (Gmail App Password).
 */
export class SmtpMailer implements IMailer {
  readonly driver = 'smtp' as const;

  async send(input: SendMailInput): Promise<SendMailResult> {
    if (!env.SMTP_HOST) {
      throw new AppError(
        'SERVICE_UNAVAILABLE',
        'SMTP mailer selected but SMTP_HOST is not configured',
        503,
      );
    }
    if (!env.SMTP_USER || !env.SMTP_PASS) {
      throw new AppError(
        'SERVICE_UNAVAILABLE',
        'SMTP mailer selected but SMTP_USER / SMTP_PASS are not configured',
        503,
      );
    }

    const nodemailer = await import('nodemailer');
    const port = env.SMTP_PORT ?? 587;
    const secure = env.SMTP_SECURE === 'true' || port === 465;

    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port,
      secure,
      auth: {
        user: env.SMTP_USER,
        // Gmail App Passwords are often pasted with spaces; strip them.
        pass: env.SMTP_PASS.replace(/\s+/g, ''),
      },
      requireTLS: !secure && port === 587,
      tls: {
        // Gmail and most providers present valid certs; keep min TLS 1.2
        minVersion: 'TLSv1.2',
      },
      connectionTimeout: 15_000,
      greetingTimeout: 15_000,
      socketTimeout: 30_000,
    });

    try {
      await transporter.verify();
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      logger.error({ err, host: env.SMTP_HOST, port }, 'SMTP verify failed');
      throw new AppError(
        'SERVICE_UNAVAILABLE',
        `SMTP connection failed: ${detail}`,
        503,
      );
    }

    const info = await transporter.sendMail({
      from: env.MAIL_FROM ?? env.SMTP_USER,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo,
      headers: input.headers,
    });

    logger.info(
      { mail: true, driver: this.driver, messageId: info.messageId, to: input.to },
      'Email sent (smtp)',
    );

    return {
      messageId: info.messageId || createId(),
      accepted: info.accepted.map(String),
      rejected: info.rejected.map(String),
      driver: this.driver,
    };
  }

  async isHealthy(): Promise<boolean> {
    if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) return false;
    try {
      const nodemailer = await import('nodemailer');
      const port = env.SMTP_PORT ?? 587;
      const secure = env.SMTP_SECURE === 'true' || port === 465;
      const transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port,
        secure,
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
        requireTLS: !secure && port === 587,
        connectionTimeout: 10_000,
      });
      await transporter.verify();
      return true;
    } catch {
      return false;
    }
  }
}
