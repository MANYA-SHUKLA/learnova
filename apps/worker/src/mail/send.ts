import { createId } from '@learnova/utils';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import type { EmailJobPayload } from '../jobs/index.js';

export interface WorkerMailResult {
  messageId: string;
  driver: 'console' | 'smtp';
}

/**
 * Worker-side mail sender for the email queue.
 * Console by default; SMTP when MAIL_DRIVER=smtp and host is set.
 */
export async function sendWorkerEmail(payload: EmailJobPayload): Promise<WorkerMailResult> {
  const driver = env.MAIL_DRIVER ?? 'console';

  if (driver === 'smtp' && env.SMTP_HOST) {
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
      from: env.MAIL_FROM ?? 'shuklamanya99@gmail.com',
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      replyTo: payload.replyTo,
    });

    return {
      messageId: info.messageId || createId(),
      driver: 'smtp',
    };
  }

  const messageId = `console-${createId()}`;
  logger.info(
    {
      mail: true,
      driver: 'console',
      to: payload.to,
      subject: payload.subject,
      messageId,
      correlationId: payload.correlationId,
      templateId: payload.templateId,
      text: payload.text,
      html: payload.html,
    },
    'Worker email sent (console)',
  );
  return { messageId, driver: 'console' };
}
