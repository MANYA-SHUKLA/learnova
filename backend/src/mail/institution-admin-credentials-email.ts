import { sendMail } from '../mail/index.js';
import {
  mailButton,
  mailDetailCard,
  mailGreeting,
  mailHtml,
  mailMuted,
  mailParagraph,
  mailText,
} from '../mail/mail-copy.js';
import { logger } from '../utils/logger/index.js';

function frontendBaseUrl(): string {
  const origins = process.env.CORS_ORIGINS ?? 'http://localhost:3000';
  return origins.split(',')[0]?.trim().replace(/\/$/, '') || 'http://localhost:3000';
}

export interface SendInstitutionAdminCredentialsInput {
  to: string;
  firstName: string;
  institutionName: string;
  institutionSlug: string;
  temporaryPassword: string;
}

export async function sendInstitutionAdminCredentialsEmail(
  input: SendInstitutionAdminCredentialsInput,
): Promise<boolean> {
  const base = frontendBaseUrl();
  const loginUrl = `${base}/en/login`;
  const guideUrl = `${base}/en/${encodeURIComponent(input.institutionSlug)}/guide`;
  const portalUrl = `${base}/en/${encodeURIComponent(input.institutionSlug)}`;

  const subject = `Your ${input.institutionName} campus admin account on Learnova`;

  const bodyHtml = [
    mailGreeting(input.firstName),
    mailParagraph(
      `Your institution <strong>${input.institutionName}</strong> has been allocated on Learnova. Use the credentials below to sign in as <strong>campus administrator</strong>.`,
    ),
    mailDetailCard([
      { label: 'Institution', value: input.institutionName },
      { label: 'Campus URL', value: portalUrl },
      { label: 'Admin email', value: input.to },
      { label: 'Temporary password', value: input.temporaryPassword, mono: true },
    ]),
    mailButton(loginUrl, 'Sign in'),
    mailParagraph(
      `Before your first session, read the <a href="${guideUrl}" style="color:#0f766e;">campus admin guide</a> for setup steps and modules.`,
    ),
    mailParagraph(
      'On first login you must <strong>set a new password</strong> (current temporary password + new password).',
    ),
    mailMuted('This temporary password is shown only in this email. Do not share it.'),
  ].join('\n');

  const bodyText = [
    `Hello ${input.firstName},`,
    '',
    `${input.institutionName} is ready on Learnova.`,
    '',
    `Campus portal: ${portalUrl}`,
    `Admin guide: ${guideUrl}`,
    `Sign in: ${loginUrl}`,
    `Email: ${input.to}`,
    `Temporary password: ${input.temporaryPassword}`,
    '',
    'On first login you must set a new password.',
  ].join('\n');

  try {
    await sendMail({
      to: input.to,
      subject,
      html: mailHtml(bodyHtml, {
        preheader: `${input.institutionName} — campus admin credentials for Learnova.`,
      }),
      text: mailText(bodyText),
    });
    logger.info({ to: input.to, slug: input.institutionSlug }, 'Institution admin credentials email sent');
    return true;
  } catch (err) {
    logger.warn({ err, to: input.to }, 'Institution admin credentials email failed');
    return false;
  }
}
