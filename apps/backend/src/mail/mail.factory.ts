import { env } from '../config/env.js';
import { logger } from '../utils/logger/index.js';
import { ConsoleMailer } from './console.mailer.js';
import { SmtpMailer } from './smtp.mailer.js';
import { SesMailer } from './ses.mailer.js';
import type { IMailer } from './types.js';

let mailer: IMailer | null = null;

export function createMailer(): IMailer {
  const driver = env.MAIL_DRIVER ?? 'console';

  switch (driver) {
    case 'smtp':
      logger.info({ driver: 'smtp', host: env.SMTP_HOST }, 'Mail driver: smtp');
      return new SmtpMailer();
    case 'ses':
      logger.info({ driver: 'ses' }, 'Mail driver: ses');
      return new SesMailer();
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

export function resetMailerForTests(): void {
  mailer = null;
}
