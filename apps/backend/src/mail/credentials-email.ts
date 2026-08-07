/**
 * Email temporary login credentials to newly provisioned faculty/students.
 * Uses the active mail driver (console in pure-local, smtp when configured).
 */

import { sendMail } from '../mail/index.js';
import { mailHtml, mailText } from '../mail/mail-copy.js';
import { logger } from '../utils/logger/index.js';

export type CredentialsEmailRole = 'faculty' | 'student';

export interface SendCredentialsEmailInput {
  to: string;
  firstName: string;
  role: CredentialsEmailRole;
  temporaryPassword: string;
  /** Employee ID / Student ID for the handoff email */
  displayIdLabel: string;
  displayId: string;
}

function loginUrl(): string {
  const origins = process.env.CORS_ORIGINS ?? 'http://localhost:3000';
  const base = origins.split(',')[0]?.trim().replace(/\/$/, '') || 'http://localhost:3000';
  return `${base}/en/login`;
}

/**
 * Fire-and-forget safe: callers should await if they need delivery confirmation in tests.
 * Failures are logged; provisioning still succeeds.
 */
export async function sendCredentialsEmail(input: SendCredentialsEmailInput): Promise<boolean> {
  const roleLabel = input.role === 'faculty' ? 'Faculty' : 'Student';
  const subject = `Your Learnova ${roleLabel} account credentials`;
  const login = loginUrl();

  const bodyHtml = `
<p>Hello ${input.firstName},</p>
<p>Your Learnova <strong>${roleLabel}</strong> account is ready.</p>
<ul>
  <li><strong>${input.displayIdLabel}:</strong> ${input.displayId}</li>
  <li><strong>Email:</strong> ${input.to}</li>
  <li><strong>Temporary password:</strong> <code>${input.temporaryPassword}</code></li>
</ul>
<p>Sign in at <a href="${login}">${login}</a> and <strong>change your password</strong> on first login.</p>
<p style="font-size:13px;color:#64748b;">This temporary password is shown only once. Do not share it.</p>
`.trim();

  const bodyText = [
    `Hello ${input.firstName},`,
    '',
    `Your Learnova ${roleLabel} account is ready.`,
    `${input.displayIdLabel}: ${input.displayId}`,
    `Email: ${input.to}`,
    `Temporary password: ${input.temporaryPassword}`,
    '',
    `Sign in at ${login} and change your password on first login.`,
    'This temporary password is shown only once. Do not share it.',
  ].join('\n');

  try {
    await sendMail({
      to: input.to,
      subject,
      html: mailHtml(bodyHtml),
      text: mailText(bodyText),
    });
    logger.info({ to: input.to, role: input.role }, 'Credentials email sent');
    return true;
  } catch (err) {
    logger.warn({ err, to: input.to, role: input.role }, 'Credentials email failed');
    return false;
  }
}
