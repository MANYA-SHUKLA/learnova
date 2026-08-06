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
  if (!mailer) {
    mailer = createMailer();
  }
  return mailer;
}

/**
 * Send immediately or enqueue to mail queue based on MAIL_QUEUE_ENABLED.
 */
export async function sendMail(input: SendMailInput): Promise<SendMailResult | { jobId?: string }> {
  if (mailConfig.queueEnabled) {
    const jobId = await enqueueEmail({
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo,
    });
    return { jobId };
  }
  return getMailer().send(input);
}

export function resetMailerForTests(): void {
  mailer = null;
}
