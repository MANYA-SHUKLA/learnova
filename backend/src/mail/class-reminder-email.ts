/**
 * Branded HTML for daily class reminder emails.
 */

import {
  mailButton,
  mailEscape,
  mailGreeting,
  mailHtml,
  mailLoginUrl,
  mailParagraph,
} from '../mail/mail-copy.js';

export interface ClassReminderRow {
  startTime: string;
  endTime: string;
  courseTitle: string;
  sectionName: string;
  facultyName: string;
  room: string;
}

export function buildClassReminderEmail(name: string, dateLabel: string, classes: ClassReminderRow[]) {
  const rows = classes
    .map(
      (c) => `
<tr>
  <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#0f172a;white-space:nowrap;">${mailEscape(c.startTime)}–${mailEscape(c.endTime)}</td>
  <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#0f172a;">${mailEscape(c.courseTitle)}</td>
  <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#334155;">${mailEscape(c.sectionName)}</td>
  <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#334155;">${mailEscape(c.facultyName)}</td>
  <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#334155;">${mailEscape(c.room)}</td>
</tr>`,
    )
    .join('');

  const table = `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:16px 0;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
  <thead>
    <tr style="background:#f1f5f9;">
      <th align="left" style="padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#64748b;">Time</th>
      <th align="left" style="padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#64748b;">Course</th>
      <th align="left" style="padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#64748b;">Section</th>
      <th align="left" style="padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#64748b;">Faculty</th>
      <th align="left" style="padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#64748b;">Room</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>`;

  const bodyHtml = [
    mailGreeting(name),
    mailParagraph(`You have <strong>${classes.length}</strong> class${classes.length === 1 ? '' : 'es'} scheduled for <strong>${mailEscape(dateLabel)}</strong>.`),
    table,
    mailButton(mailLoginUrl(), 'Open Learnova'),
  ].join('');

  const textLines = classes.map(
    (c) =>
      `${c.startTime}-${c.endTime} | ${c.courseTitle} | ${c.sectionName} | ${c.facultyName} | ${c.room}`,
  );

  return {
    subject: `Your classes today — ${dateLabel}`,
    html: mailHtml(bodyHtml),
    text: `Hello ${name},\n\nYour classes for ${dateLabel}:\n${textLines.join('\n')}\n\nOpen Learnova: ${mailLoginUrl()}`,
  };
}
