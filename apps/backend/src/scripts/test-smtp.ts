/**
 * One-shot SMTP smoke test.
 * Usage: pnpm --filter @learnova/backend exec tsx --env-file=.env src/scripts/test-smtp.ts [toEmail]
 */

import '../config/load-env.js';
import { env } from '../config/env.js';
import { resetMailerForTests, sendMail } from '../mail/index.js';
import {
  mailButton,
  mailGreeting,
  mailHtml,
  mailLoginUrl,
  mailMuted,
  mailParagraph,
  mailText,
} from '../mail/mail-copy.js';
import { logger } from '../utils/logger/index.js';

async function main() {
  const to = process.argv[2] ?? env.MAIL_FROM ?? env.SMTP_USER;
  if (!to) {
    throw new Error('Provide a recipient: tsx ... test-smtp.ts shuklamanya99@gmail.com');
  }

  logger.info(
    {
      driver: env.MAIL_DRIVER,
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      user: env.SMTP_USER,
      from: env.MAIL_FROM,
      queue: env.MAIL_QUEUE_ENABLED,
      to,
    },
    'SMTP smoke test starting (password redacted)',
  );

  if (env.MAIL_DRIVER !== 'smtp' && env.MAIL_DRIVER !== 'nodemailer') {
    throw new Error(`MAIL_DRIVER must be smtp (current: ${env.MAIL_DRIVER ?? 'undefined'})`);
  }

  resetMailerForTests();

  const login = mailLoginUrl();
  const result = await sendMail({
    to,
    subject: 'Learnova SMTP test — looking good',
    html: mailHtml(
      [
        mailGreeting('Manya'),
        mailParagraph(
          'SMTP is connected and your Learnova transactional emails are ready — welcome, credentials, verify, and password reset.',
        ),
        mailButton(login, 'Open Learnova'),
        mailMuted('This was a one-time smoke test from your local development environment.'),
      ].join('\n'),
      { preheader: 'Learnova SMTP is working.' },
    ),
    text: mailText(
      `Hello Manya,\n\nSMTP is working for Learnova.\nOpen: ${login}\n\nThis was a local smoke test.`,
    ),
  });

  logger.info({ result }, 'SMTP smoke test OK');
  console.log('\n✅ SMTP OK — check inbox (and spam) for:', to);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err: unknown) => {
  console.error('\n❌ SMTP FAILED');
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
