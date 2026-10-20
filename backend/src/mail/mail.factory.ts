import { env } from '../config/env.js';
import { mailConfig } from '../config/slices.js';
import { logger } from '../utils/logger/index.js';
import { ConsoleMailer } from './console.mailer.js';
import { SmtpMailer } from './smtp.mailer.js';
import { SesMailer } from './ses.mailer.js';
import { HttpApiMailer } from './http-api.mailer.js';
import type { IMailer } from './types.js';
import { enqueueEmail } from '../queues/producer.js';
import type { SendMailInput, SendMailResult } from './types.js';

let mailer: IMailer | null = null;

export function createMailer(): IMailer {
  const driver = mailConfig.driver;

  switch (driver) {
    case 'smtp':
    case 'nodemailer':
      logger.info({ driver: 'smtp', host: mailConfig.smtp.host }, 'Mail driver: smtp/nodemailer');
      return new SmtpMailer();
    case 'ses':
      logger.info({ driver: 'ses' }, 'Mail driver: ses');
      return new SesMailer();
    case 'resend':
      logger.info({ driver: 'resend' }, 'Mail driver: resend');
      return new HttpApiMailer('resend', mailConfig.resendApiKey);
    case 'brevo':
      logger.info({ driver: 'brevo' }, 'Mail driver: brevo');
      return new HttpApiMailer('brevo', mailConfig.brevoApiKey);
    case 'console':
    default:
      logger.info({ driver: 'console' }, 'Mail driver: console');
      return new ConsoleMailer();
  }
}

export function getMailer(): IMailer {
  mailer ??= createMailer();
  return mailer;
}

function isLocalFrontendOrigin(): boolean {
  const origins = (env.CORS_ORIGINS ?? 'http://localhost:3000').split(',');
  return origins.some((origin) => /localhost|127\.0\.0\.1/i.test(origin.trim()));
}

/** Queue in deployed environments; inline for local dev (no worker required). */
function shouldUseMailQueue(): boolean {
  if (env.MAIL_SEND_INLINE === 'true') return false;
  if (env.MAIL_SEND_INLINE === 'false') return mailConfig.queueEnabled;
  if (!mailConfig.queueEnabled) return false;
  if (env.NODE_ENV === 'development' || env.NODE_ENV === 'test') return false;
  if (isLocalFrontendOrigin()) return false;
  return true;
}

export async function sendMail(input: SendMailInput): Promise<SendMailResult | { jobId?: string }> {
  if (shouldUseMailQueue()) {
    try {
      const jobId = await enqueueEmail({
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        replyTo: input.replyTo,
      });
      logger.info(
        { mail: true, queued: true, jobId, to: input.to, subject: input.subject },
        'Email queued (worker must be running)',
      );
      return { jobId };
    } catch (err) {
      logger.warn(
        { err, to: input.to },
        'Email queue unavailable — sending inline',
      );
      return getMailer().send(input);
    }
  }
  return getMailer().send(input);
}

export function resetMailerForTests(): void {
  mailer = null;
}
