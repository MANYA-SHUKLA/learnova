/** Contact shown in all Learnova transactional emails. */
export const MAIL_CONTACT_EMAIL = 'shuklamanya99@gmail.com';

const contactHtml = `
<p style="margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:13px;color:#64748b;">
  Questions? Contact <a href="mailto:${MAIL_CONTACT_EMAIL}">${MAIL_CONTACT_EMAIL}</a>
</p>
<p style="font-size:12px;color:#94a3b8;">— Learnova</p>
`.trim();

const contactText = `\n\nQuestions? Contact ${MAIL_CONTACT_EMAIL}\n— Learnova`;

export function mailHtml(body: string): string {
  return `${body}${contactHtml}`;
}

export function mailText(body: string): string {
  return `${body}${contactText}`;
}
