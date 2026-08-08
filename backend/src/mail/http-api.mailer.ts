import { createId } from '@learnova/utils';
import { mailConfig } from '../config/slices.js';
import { logger } from '../utils/logger/index.js';
import { AppError } from '../utils/errors/index.js';
import type { IMailer, SendMailInput, SendMailResult } from './types.js';

function toList(value: string | string[]): string[] {
  return Array.isArray(value) ? value : [value];
}

/** HTTP API mail providers — abstraction ready; keys required at send time */
export class HttpApiMailer implements IMailer {
  constructor(
    readonly driver: 'resend' | 'brevo',
    private readonly apiKey: string | undefined,
  ) {}

  send(input: SendMailInput): Promise<SendMailResult> {
    if (!this.apiKey) {
      return Promise.reject(
        new AppError(
          'SERVICE_UNAVAILABLE',
          `${this.driver} selected but API key is not configured`,
          503,
        ),
      );
    }

    // Provider HTTP wiring reserved — log + accept for foundation
    const messageId = `${this.driver}-${createId()}`;
    logger.info(
      {
        mail: true,
        driver: this.driver,
        from: mailConfig.from,
        to: toList(input.to),
        subject: input.subject,
        messageId,
        prepared: true,
      },
      `Email queued via ${this.driver} abstraction (HTTP adapter pending)`,
    );

    return Promise.resolve({
      messageId,
      accepted: toList(input.to),
      rejected: [],
      driver: this.driver,
    });
  }

  isHealthy(): Promise<boolean> {
    return Promise.resolve(Boolean(this.apiKey));
  }
}
