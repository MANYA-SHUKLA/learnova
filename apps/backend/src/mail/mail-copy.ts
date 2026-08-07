/**
 * Beautiful transactional email layout for Learnova.
 * All HTML emails go through mailHtml() so header + footer stay consistent.
 */

export const MAIL_CONTACT_EMAIL = 'shuklamanya99@gmail.com';
export const MAIL_CONTACT_PHONE = '8005586588';
export const MAIL_CONTACT_NAME = 'Manya Shukla';
export const MAIL_BRAND = 'Learnova';

const WHATSAPP_URL = `https://wa.me/91${MAIL_CONTACT_PHONE}`;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function mailEscape(value: string): string {
  return escapeHtml(value);
}

function frontendBase(): string {
  const origins = process.env.CORS_ORIGINS ?? 'http://localhost:3000';
  return origins.split(',')[0]?.trim().replace(/\/$/, '') || 'http://localhost:3000';
}

export function mailLoginUrl(locale = 'en'): string {
  return `${frontendBase()}/${locale}/login`;
}

/** Primary CTA button */
export function mailButton(href: string, label: string): string {
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(label);
  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 8px;">
  <tr>
    <td align="center" bgcolor="#0f766e" style="border-radius:12px;">
      <a href="${safeHref}"
         style="display:inline-block;padding:14px 28px;font-family:Georgia,'Times New Roman',serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:12px;letter-spacing:0.02em;">
        ${safeLabel}
      </a>
    </td>
  </tr>
</table>`.trim();
}

export function mailGreeting(name: string): string {
  return `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#0f172a;">Hello <strong>${escapeHtml(name)}</strong>,</p>`;
}

export function mailParagraph(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155;">${text}</p>`;
}

export function mailMuted(text: string): string {
  return `<p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#64748b;">${text}</p>`;
}

/** Credential / detail card */
export function mailDetailCard(rows: Array<{ label: string; value: string; mono?: boolean }>): string {
  const items = rows
    .map((row) => {
      const valueStyle = row.mono
        ? 'font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:14px;letter-spacing:0.04em;color:#0f766e;font-weight:600;'
        : 'font-size:14px;color:#0f172a;font-weight:600;';
      return `
<tr>
  <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;width:42%;vertical-align:top;">
    ${escapeHtml(row.label)}
  </td>
  <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;${valueStyle}vertical-align:top;word-break:break-all;">
    ${escapeHtml(row.value)}
  </td>
</tr>`.trim();
    })
    .join('');

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
  style="margin:20px 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;">
  <tr>
    <td style="padding:4px 20px 8px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${items}
      </table>
    </td>
  </tr>
</table>`.trim();
}

function htmlFooter(): string {
  const year = new Date().getFullYear();
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;">
  <tr>
    <td style="padding:28px 32px;background:#0f172a;border-radius:0 0 18px 18px;">
      <p style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:700;color:#f8fafc;letter-spacing:-0.02em;">
        ${MAIL_BRAND}
      </p>
      <p style="margin:0 0 18px;font-size:13px;line-height:1.5;color:#94a3b8;">
        Enterprise AI learning for institutions
      </p>
      <p style="margin:0 0 6px;font-size:13px;color:#cbd5e1;">
        Made with care by <strong style="color:#f8fafc;">${MAIL_CONTACT_NAME}</strong>
      </p>
      <p style="margin:0 0 4px;font-size:13px;color:#94a3b8;">
        <a href="mailto:${MAIL_CONTACT_EMAIL}" style="color:#5eead4;text-decoration:none;">${MAIL_CONTACT_EMAIL}</a>
        &nbsp;·&nbsp;
        <a href="tel:+91${MAIL_CONTACT_PHONE}" style="color:#5eead4;text-decoration:none;">${MAIL_CONTACT_PHONE}</a>
      </p>
      <p style="margin:12px 0 0;font-size:12px;">
        <a href="${WHATSAPP_URL}" style="color:#5eead4;text-decoration:none;">WhatsApp ${MAIL_CONTACT_NAME}</a>
      </p>
      <p style="margin:20px 0 0;padding-top:16px;border-top:1px solid #1e293b;font-size:11px;line-height:1.5;color:#64748b;">
        © ${year} ${MAIL_BRAND}. This message was sent regarding your account.
        If you did not expect it, you can ignore this email.
      </p>
    </td>
  </tr>
</table>`.trim();
}

function textFooter(): string {
  const year = new Date().getFullYear();
  return [
    '',
    '—',
    MAIL_BRAND,
    `Made with care by ${MAIL_CONTACT_NAME}`,
    `Email: ${MAIL_CONTACT_EMAIL}`,
    `Phone: ${MAIL_CONTACT_PHONE}`,
    `WhatsApp: ${WHATSAPP_URL}`,
    `© ${year} ${MAIL_BRAND}`,
  ].join('\n');
}

/**
 * Wrap body HTML in the Learnova email chrome (header + content + footer).
 */
export function mailHtml(body: string, options?: { preheader?: string }): string {
  const preheader = options?.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(options.preheader)}</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${MAIL_BRAND}</title>
</head>
<body style="margin:0;padding:0;background:#eef2f1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  ${preheader}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#eef2f1;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 8px 30px rgba(15,23,42,0.08);">
          <tr>
            <td style="padding:28px 32px 20px;background:linear-gradient(135deg,#0f766e 0%,#115e59 100%);">
              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">
                ${MAIL_BRAND}
              </p>
              <p style="margin:6px 0 0;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#99f6e4;">
                Learning platform
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${body}
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 0;">
              ${htmlFooter()}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

export function mailText(body: string): string {
  return `${body.trim()}${textFooter()}`;
}
