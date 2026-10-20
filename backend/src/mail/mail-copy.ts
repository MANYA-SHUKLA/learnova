/**
 * Transactional email layout — palette aligned with
 * `frontend/src/lib/marketing-design.ts` and `--primary` in globals.css.
 */

export const MAIL_CONTACT_EMAIL = 'shuklamanya99@gmail.com';
export const MAIL_CONTACT_PHONE = '8005586588';
export const MAIL_CONTACT_NAME = 'Manya Shukla';
export const MAIL_BRAND = 'Learnova';
export const MAIL_TAGLINE = 'Learn. Build. Excel.';

/** Brand tokens (keep in sync with marketing site) */
const MAIL_PRIMARY = '#4F46E5';
const MAIL_PRIMARY_DARK = '#4338CA';
const MAIL_NAVY = '#14243A';
const MAIL_PALE = '#EEF2FF';
const MAIL_PAGE_BG = '#F5F7FA';
const MAIL_CARD_BG = '#FFFFFF';
const MAIL_BORDER = '#E2E8F0';
const MAIL_TEXT = '#475569';
const MAIL_HEADING = '#14243A';
const MAIL_MUTED = '#64748B';
const MAIL_FOOTER_MUTED = '#94A3B8';
const MAIL_FOOTER_TEXT = '#CBD5E1';
const MAIL_LINK_ON_DARK = '#A5B4FC';
const MAIL_ROSE = '#FB7185';

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

/** Primary CTA — matches marketing `marketingBtnPrimary` */
export function mailButton(href: string, label: string): string {
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(label);
  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 8px;">
  <tr>
    <td align="center" bgcolor="${MAIL_PRIMARY}" style="border-radius:12px;box-shadow:0 4px 14px rgba(79,70,229,0.35);">
      <a href="${safeHref}"
         style="display:inline-block;padding:14px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:12px;letter-spacing:0.01em;">
        ${safeLabel}
      </a>
    </td>
  </tr>
</table>`.trim();
}

export function mailGreeting(name: string): string {
  return `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${MAIL_HEADING};">Hello <strong>${escapeHtml(name)}</strong>,</p>`;
}

export function mailParagraph(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${MAIL_TEXT};">${text}</p>`;
}

export function mailMuted(text: string): string {
  return `<p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:${MAIL_MUTED};">${text}</p>`;
}

/** Credential / detail card — pale indigo panel like marketing cards */
export function mailDetailCard(rows: Array<{ label: string; value: string; mono?: boolean }>): string {
  const items = rows
    .map((row) => {
      const valueStyle = row.mono
        ? `font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:14px;letter-spacing:0.04em;color:${MAIL_PRIMARY};font-weight:600;`
        : `font-size:14px;color:${MAIL_HEADING};font-weight:600;`;
      return `
<tr>
  <td style="padding:10px 0;border-bottom:1px solid ${MAIL_BORDER};font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:${MAIL_MUTED};width:42%;vertical-align:top;">
    ${escapeHtml(row.label)}
  </td>
  <td style="padding:10px 0;border-bottom:1px solid ${MAIL_BORDER};${valueStyle}vertical-align:top;word-break:break-all;">
    ${escapeHtml(row.value)}
  </td>
</tr>`.trim();
    })
    .join('');

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
  style="margin:20px 0;background:${MAIL_PALE};border:1px solid ${MAIL_BORDER};border-radius:12px;">
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
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:0;">
  <tr>
    <td style="padding:28px 32px;background:${MAIL_NAVY};border-radius:0 0 16px 16px;border-top:1px solid rgba(255,255,255,0.12);">
      <p style="margin:0 0 4px;font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">
        ${MAIL_BRAND}
      </p>
      <p style="margin:0 0 18px;font-size:13px;line-height:1.5;color:${MAIL_FOOTER_MUTED};">
        ${MAIL_TAGLINE}
      </p>
      <p style="margin:0 0 14px;font-size:13px;line-height:1.6;color:${MAIL_FOOTER_TEXT};">
        Made with <span style="color:${MAIL_ROSE};">♥</span> by
        <strong style="color:#ffffff;">${MAIL_CONTACT_NAME}</strong>
        · ${year} · SOE JNU Minor Project
      </p>
      <p style="margin:0 0 4px;font-size:13px;color:${MAIL_FOOTER_MUTED};">
        <a href="mailto:${MAIL_CONTACT_EMAIL}" style="color:${MAIL_LINK_ON_DARK};text-decoration:none;">${MAIL_CONTACT_EMAIL}</a>
        &nbsp;·&nbsp;
        <a href="tel:+91${MAIL_CONTACT_PHONE}" style="color:${MAIL_LINK_ON_DARK};text-decoration:none;">${MAIL_CONTACT_PHONE}</a>
      </p>
      <p style="margin:10px 0 0;font-size:12px;">
        <a href="${WHATSAPP_URL}" style="color:${MAIL_LINK_ON_DARK};text-decoration:none;">WhatsApp ${MAIL_CONTACT_NAME}</a>
      </p>
      <p style="margin:20px 0 0;padding-top:16px;border-top:1px solid rgba(255,255,255,0.12);font-size:11px;line-height:1.5;color:${MAIL_FOOTER_MUTED};">
        © ${year} ${MAIL_BRAND}. This message was sent regarding your Learnova account.
        If you did not expect it, you can safely ignore this email.
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
    MAIL_TAGLINE,
    `Made with love by ${MAIL_CONTACT_NAME} · ${year} · SOE JNU Minor Project`,
    `Email: ${MAIL_CONTACT_EMAIL}`,
    `Phone: ${MAIL_CONTACT_PHONE}`,
    `WhatsApp: ${WHATSAPP_URL}`,
    `© ${year} ${MAIL_BRAND}`,
  ].join('\n');
}

/**
 * Wrap body HTML in Learnova email chrome (header + content + footer).
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
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${MAIL_BRAND}</title>
</head>
<body style="margin:0;padding:0;background:${MAIL_PAGE_BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  ${preheader}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${MAIL_PAGE_BG};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:${MAIL_CARD_BG};border-radius:16px;overflow:hidden;border:1px solid ${MAIL_BORDER};box-shadow:0 12px 40px rgba(20,36,58,0.08),0 0 0 1px rgba(79,70,229,0.06);">
          <tr>
            <td style="padding:0;background:linear-gradient(135deg,${MAIL_PRIMARY} 0%,${MAIL_PRIMARY_DARK} 100%);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:28px 32px 24px;">
                    <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.03em;">
                      ${MAIL_BRAND}
                    </p>
                    <p style="margin:8px 0 0;font-size:12px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.85);">
                      ${MAIL_TAGLINE}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="height:4px;background:${MAIL_PALE};border-bottom:1px solid ${MAIL_BORDER};">
              <div style="height:4px;width:72px;background:${MAIL_PRIMARY};margin:0 auto;"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 28px;">
              ${body}
            </td>
          </tr>
          <tr>
            <td style="padding:0;">
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
