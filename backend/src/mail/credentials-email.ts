/**
 * Email temporary login credentials to newly provisioned faculty/students.
 */

import { sendMail } from '../mail/index.js';
import {
  mailButton,
  mailDetailCard,
  mailEscape,
  mailGreeting,
  mailHtml,
  mailLoginUrl,
  mailMuted,
  mailParagraph,
  mailText,
} from '../mail/mail-copy.js';
import { logger } from '../utils/logger/index.js';

export type CredentialsEmailRole = 'faculty' | 'student';

export interface SendCredentialsEmailInput {
  to: string;
  firstName: string;
  role: CredentialsEmailRole;
  temporaryPassword: string;
  displayIdLabel: string;
  displayId: string;
}

export async function sendCredentialsEmail(input: SendCredentialsEmailInput): Promise<boolean> {
  const roleLabel = input.role === 'faculty' ? 'Faculty' : 'Student';
  const subject = `Your Learnova ${roleLabel} account is ready`;
  const login = mailLoginUrl();

  const bodyHtml = [
    mailGreeting(input.firstName),
    mailParagraph(
      `Your Learnova <strong>${roleLabel}</strong> account has been created by your institution. Use the details below to sign in for the first time.`,
    ),
    mailDetailCard([
      { label: input.displayIdLabel, value: input.displayId },
      { label: 'Email', value: input.to },
      { label: 'Temporary password', value: input.temporaryPassword, mono: true },
    ]),
    mailButton(login, 'Sign in to Learnova'),
    mailParagraph(
      'On first login you will be asked to <strong>set a personal password</strong>. You cannot skip this step.',
    ),
    mailMuted(
      'This temporary password is shown only once. Keep it private and do not forward this email.',
    ),
  ].join('\n');

  const bodyText = [
    `Hello ${input.firstName},`,
    '',
    `Your Learnova ${roleLabel} account has been created by your institution.`,
    '',
    `${input.displayIdLabel}: ${input.displayId}`,
    `Email: ${input.to}`,
    `Temporary password: ${input.temporaryPassword}`,
    '',
    `Sign in: ${login}`,
    'On first login you must set a personal password.',
    '',
    'This temporary password is shown only once. Keep it private.',
  ].join('\n');

  try {
    await sendMail({
      to: input.to,
      subject,
      html: mailHtml(bodyHtml, {
        preheader: `Your ${roleLabel} credentials for Learnova — sign in and set a new password.`,
      }),
      text: mailText(bodyText),
    });
    logger.info({ to: input.to, role: input.role }, 'Credentials email sent');
    return true;
  } catch (err) {
    logger.warn({ err, to: input.to, role: input.role }, 'Credentials email failed');
    return false;
  }
}

/** Keep escape helper available for callers that embed dynamic HTML. */
export { mailEscape };
