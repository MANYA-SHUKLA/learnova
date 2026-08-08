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
  driver: MailDriver;
}

export type MailDriver = 'console' | 'smtp' | 'ses' | 'resend' | 'brevo' | 'nodemailer';

/**
 * Email port — console / smtp / nodemailer / resend / brevo / ses.
 */
export interface IMailer {
  readonly driver: MailDriver;
  send(input: SendMailInput): Promise<SendMailResult>;
  isHealthy(): Promise<boolean>;
}
