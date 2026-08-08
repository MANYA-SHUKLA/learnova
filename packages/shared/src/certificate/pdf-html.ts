import { CERTIFICATE_PDF_THEME } from '@learnova/constants';

export interface CertificatePdfInput {
  title: string;
  institutionName: string;
  studentName: string;
  bodyHtml: string;
  verificationCode: string;
  verificationUrl: string;
  certificateNumber: string;
  issuedAt: string;
  logoUrl?: string | null;
  watermark?: string | null;
  primaryColor?: string | null;
  accentColor?: string | null;
  signatures?: Array<{ name: string; title: string; role: string }>;
}

export function renderCertificateHtml(input: CertificatePdfInput): string {
  const theme = {
    primary: input.primaryColor ?? CERTIFICATE_PDF_THEME.primary,
    accent: input.accentColor ?? CERTIFICATE_PDF_THEME.accent,
    secondary: CERTIFICATE_PDF_THEME.secondary,
    border: CERTIFICATE_PDF_THEME.border,
    muted: CERTIFICATE_PDF_THEME.muted,
    background: CERTIFICATE_PDF_THEME.background,
    card: CERTIFICATE_PDF_THEME.card,
    fontFamily: CERTIFICATE_PDF_THEME.fontFamily,
    gradient: CERTIFICATE_PDF_THEME.gradient,
  };

  const signatures = (input.signatures ?? [])
    .map(
      (sig) =>
        `<div class="sig"><div class="sig-line"></div><p><strong>${sig.name}</strong><br/>${sig.title}<br/><span class="muted">${sig.role}</span></p></div>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${input.title}</title>
  <style>
    @page { size: A4 landscape; margin: 20mm; }
    * { box-sizing: border-box; }
    body {
      font-family: ${theme.fontFamily};
      color: ${theme.secondary};
      margin: 0;
      background: ${theme.background};
    }
    .page {
      background: ${theme.card};
      border: 1px solid ${theme.border};
      border-radius: 16px;
      box-shadow: 0 16px 40px -8px rgb(15 23 42 / 0.12);
      padding: 40px 48px;
      min-height: 520px;
      position: relative;
      overflow: hidden;
    }
    .page::before {
      content: '';
      position: absolute;
      inset: 0 0 auto 0;
      height: 6px;
      background: ${theme.gradient};
    }
    .watermark {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 64px;
      font-weight: 700;
      color: ${theme.primary};
      opacity: 0.04;
      transform: rotate(-18deg);
      pointer-events: none;
    }
    .header { text-align: center; position: relative; z-index: 1; }
    .logo { max-height: 56px; margin-bottom: 16px; }
    h1 {
      font-size: 26px;
      letter-spacing: 0.06em;
      margin: 8px 0;
      text-transform: uppercase;
      color: ${theme.secondary};
    }
    .institution { font-size: 16px; color: ${theme.muted}; font-weight: 500; }
    .student {
      font-size: 30px;
      margin: 28px 0 12px;
      font-weight: 700;
      color: ${theme.primary};
    }
    .body {
      text-align: center;
      font-size: 15px;
      line-height: 1.65;
      max-width: 720px;
      margin: 0 auto;
      color: ${theme.secondary};
    }
    .meta {
      margin-top: 36px;
      display: flex;
      justify-content: space-between;
      gap: 24px;
      font-size: 12px;
      position: relative;
      z-index: 1;
    }
    .qr {
      border: 1px solid ${theme.border};
      border-radius: 12px;
      padding: 12px;
      text-align: center;
      min-width: 168px;
      background: ${theme.background};
    }
    .qr-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: ${theme.accent};
    }
    .qr-code {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 11px;
      word-break: break-all;
      margin-top: 6px;
      color: ${theme.secondary};
    }
    .qr-img {
      display: block;
      width: 120px;
      height: 120px;
      margin: 8px auto 0;
      border-radius: 8px;
    }
    .sigs {
      display: flex;
      gap: 32px;
      justify-content: center;
      margin-top: 32px;
      position: relative;
      z-index: 1;
    }
    .sig { text-align: center; min-width: 160px; font-size: 12px; }
    .sig-line { border-top: 1px solid ${theme.border}; margin-bottom: 8px; }
    .muted { color: ${theme.muted}; font-size: 11px; }
    strong { color: ${theme.secondary}; }
  </style>
</head>
<body>
  <div class="page">
    ${input.watermark ? `<div class="watermark">${input.watermark}</div>` : ''}
    <div class="header">
      ${input.logoUrl ? `<img class="logo" src="${input.logoUrl}" alt="" />` : ''}
      <div class="institution">${input.institutionName}</div>
      <h1>${input.title}</h1>
    </div>
    <div class="body">
      <p>This certifies that</p>
      <div class="student">${input.studentName}</div>
      ${input.bodyHtml}
    </div>
    <div class="sigs">${signatures}</div>
    <div class="meta">
      <div>
        <div><strong>Certificate No.</strong> ${input.certificateNumber}</div>
        <div><strong>Issued</strong> ${input.issuedAt}</div>
      </div>
      <div class="qr">
        <div class="qr-label">Scan to verify</div>
        <img
          class="qr-img"
          src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&amp;data=${encodeURIComponent(input.verificationUrl)}"
          alt="Verification QR code"
        />
        <div class="qr-code">${input.verificationCode}</div>
        <div class="muted">${input.verificationUrl}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}
