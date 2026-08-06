export interface SendMailInput {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  headers?: Record<string, string>;
}

export interface SendMailResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
  driver: 'console' | 'smtp' | 'ses';
}

/**
 * Email port — console for local, SMTP/SES when configured.
 */
export interface IMailer {
  readonly driver: 'console' | 'smtp' | 'ses';
  send(input: SendMailInput): Promise<SendMailResult>;
  isHealthy(): Promise<boolean>;
}
