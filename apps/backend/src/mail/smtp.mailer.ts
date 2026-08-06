import { createId } from '@learnova/utils';
import { env } from '../config/env.js';
import { logger } from '../utils/logger/index.js';
import { AppError } from '../utils/errors/index.js';
import type { IMailer, SendMailInput, SendMailResult } from './types.js';

/**
 * SMTP mailer port.
 * Uses nodemailer when SMTP_HOST is set; otherwise fails closed with a clear error.
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

    // Dynamic import keeps console-only installs free of transport init cost
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT ?? 587,
      secure: env.SMTP_SECURE === 'true',
      auth:
        env.SMTP_USER && env.SMTP_PASS
          ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
          : undefined,
    });

    const info = await transporter.sendMail({
      from: env.MAIL_FROM,
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

  isHealthy(): Promise<boolean> {
    return Promise.resolve(Boolean(env.SMTP_HOST));
  }
}
