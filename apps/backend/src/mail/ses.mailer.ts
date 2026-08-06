import { createId } from '@learnova/utils';
import { env } from '../config/env.js';
import { logger } from '../utils/logger/index.js';
import { AppError } from '../utils/errors/index.js';
import type { IMailer, SendMailInput, SendMailResult } from './types.js';

/**
 * SES port — reserved. Wire AWS SES SDK when production mail ships.
 * Until then, fail closed so misconfiguration is obvious.
 */
export class SesMailer implements IMailer {
  readonly driver = 'ses' as const;

  async send(_input: SendMailInput): Promise<SendMailResult> {
    throw new AppError(
      'SERVICE_UNAVAILABLE',
      'SES mailer is not wired yet. Use MAIL_DRIVER=console or smtp for foundation.',
      503,
    );
  }

  async isHealthy(): Promise<boolean> {
    logger.debug({ from: env.MAIL_FROM }, 'SES health: adapter not wired');
    return false;
  }

  /** Placeholder for future message id generation tests */
  createMessageId(): string {
    return `ses-${createId()}`;
  }
}
