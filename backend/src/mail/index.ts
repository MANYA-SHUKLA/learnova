export type { IMailer, SendMailInput, SendMailResult, MailDriver } from './types.js';
export { ConsoleMailer } from './console.mailer.js';
export { SmtpMailer } from './smtp.mailer.js';
export { SesMailer } from './ses.mailer.js';
export { HttpApiMailer } from './http-api.mailer.js';
export {
  createMailer,
  getMailer,
  sendMail,
  resetMailerForTests,
} from './mail.factory.js';
