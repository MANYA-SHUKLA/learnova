export type { IMailer, SendMailInput, SendMailResult } from './types.js';
export { ConsoleMailer } from './console.mailer.js';
export { SmtpMailer } from './smtp.mailer.js';
export { SesMailer } from './ses.mailer.js';
export { createMailer, getMailer, resetMailerForTests } from './mail.factory.js';
