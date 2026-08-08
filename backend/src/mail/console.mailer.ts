import { createId } from '@learnova/utils';
import { env } from '../config/env.js';
import { logger } from '../utils/logger/index.js';
import type { IMailer, SendMailInput, SendMailResult } from './types.js';

function toList(value: string | string[]): string[] {
  return Array.isArray(value) ? value : [value];
}

/** Dev/default mailer — logs instead of sending */
export class ConsoleMailer implements IMailer {
  readonly driver = 'console' as const;

  send(input: SendMailInput): Promise<SendMailResult> {
    const accepted = toList(input.to);
    const messageId = `console-${createId()}`;
    logger.info(
      {
        mail: true,
        driver: this.driver,
        from: env.MAIL_FROM,
        to: accepted,
        subject: input.subject,
        messageId,
        hasHtml: Boolean(input.html),
        textPreview: input.text?.slice(0, 120),
      },
      'Email sent (console driver)',
    );
    return Promise.resolve({ messageId, accepted, rejected: [], driver: this.driver });
  }

  isHealthy(): Promise<boolean> {
    return Promise.resolve(true);
  }
}
