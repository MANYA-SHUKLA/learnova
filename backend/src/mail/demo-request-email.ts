import { env } from '../config/env.js';
import { sendMail } from '../mail/index.js';
import {
  mailButton,
  mailGreeting,
  mailHtml,
  mailParagraph,
  mailText,
  mailEscape,
} from '../mail/mail-copy.js';
import { logger } from '../utils/logger/index.js';

function frontendBaseUrl(): string {
  return (env.CORS_ORIGINS ?? 'http://localhost:3000').split(',')[0]?.trim().replace(/\/$/, '') || 'http://localhost:3000';
}

export async function sendDemoRequestAckEmail(input: {
  to: string;
  contactName: string;
  institutionName: string;
}): Promise<void> {
  const platformUrl = `${frontendBaseUrl()}/en/platform`;
  const subject = 'We received your Learnova demo request';
  const html = mailHtml(
    [
      mailGreeting(input.contactName),
      mailParagraph(
        `Thanks for your interest in Learnova for <strong>${mailEscape(input.institutionName)}</strong>. We received your demo request and will confirm a meeting time by email shortly.`,
      ),
      mailButton(platformUrl, 'View Learnova platform'),
    ].join('\n'),
    { preheader: 'Your demo request was received.' },
  );
  const text = mailText(
    `Hello ${input.contactName},\n\nWe received your demo request for ${input.institutionName}.\n\n${platformUrl}`,
  );
  try {
    await sendMail({ to: input.to, subject, html, text });
  } catch (err) {
    logger.warn({ err, to: input.to }, 'Demo ack email failed');
  }
}

export async function sendDemoConfirmedEmails(input: {
  requesterEmail: string;
  contactName: string;
  institutionName: string;
  meetingAt: Date;
  meetingNotes?: string | null;
}): Promise<void> {
  const platformUrl = `${frontendBaseUrl()}/en/platform`;
  const when = input.meetingAt.toLocaleString('en-IN', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  });
  const notesBlock = input.meetingNotes
    ? mailParagraph(`<strong>Notes:</strong> ${mailEscape(input.meetingNotes)}`)
    : '';

  const requesterSubject = 'Your Learnova demo is confirmed';
  const requesterHtml = mailHtml(
    [
      mailGreeting(input.contactName),
      mailParagraph(
        `Your demo for <strong>${mailEscape(input.institutionName)}</strong> is confirmed for <strong>${mailEscape(when)}</strong>.`,
      ),
      notesBlock,
      mailParagraph('Learnova helps colleges run academic operations with a branded campus portal for students and faculty.'),
      mailButton(platformUrl, 'About Learnova'),
    ].join('\n'),
    { preheader: `Demo confirmed — ${when}` },
  );

  const adminEmail = env.PLATFORM_ADMIN_EMAIL;
  const adminSubject = `[Learnova] Demo confirmed — ${input.institutionName}`;
  const adminHtml = mailHtml(
    [
      mailParagraph(`Demo confirmed with ${mailEscape(input.contactName)} (${mailEscape(input.requesterEmail)}).`),
      mailParagraph(`Institution: <strong>${mailEscape(input.institutionName)}</strong>`),
      mailParagraph(`When: <strong>${mailEscape(when)}</strong>`),
      notesBlock,
    ].join('\n'),
    { preheader: adminSubject },
  );

  try {
    await sendMail({
      to: input.requesterEmail,
      subject: requesterSubject,
      html: requesterHtml,
      text: mailText(`Demo confirmed for ${when}. ${platformUrl}`),
    });
    await sendMail({
      to: adminEmail,
      subject: adminSubject,
      html: adminHtml,
      text: mailText(`Demo confirmed: ${input.institutionName} at ${when}`),
    });
  } catch (err) {
    logger.warn({ err }, 'Demo confirmation emails failed');
  }
}

export async function sendDemoDeclinedEmail(input: {
  to: string;
  contactName: string;
  reason?: string | null;
}): Promise<void> {
  const subject = 'Update on your Learnova demo request';
  const html = mailHtml(
    [
      mailGreeting(input.contactName),
      mailParagraph(
        'Thank you for your interest in Learnova. We are unable to schedule a demo at this time.',
      ),
      input.reason ? mailParagraph(mailEscape(input.reason)) : '',
      mailParagraph('You are welcome to reach out again when timing works better.'),
    ].join('\n'),
    { preheader: subject },
  );
  try {
    await sendMail({
      to: input.to,
      subject,
      html,
      text: mailText(`Hello ${input.contactName},\n\nWe cannot schedule a demo at this time.`),
    });
  } catch (err) {
    logger.warn({ err, to: input.to }, 'Demo decline email failed');
  }
}
