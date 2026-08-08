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
  signatures?: Array<{ name: string; title: string; role: string }>;
}

export function renderCertificateHtml(input: CertificatePdfInput): string {
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
    @page { size: A4 landscape; margin: 24mm; }
    body { font-family: Georgia, 'Times New Roman', serif; color: #1a1a1a; margin: 0; }
    .page { border: 6px double #b8860b; padding: 32px; min-height: 520px; position: relative; }
    .watermark { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
      font-size: 72px; color: rgba(0,0,0,.04); transform: rotate(-24deg); pointer-events: none; }
    .header { text-align: center; }
    .logo { max-height: 64px; margin-bottom: 12px; }
    h1 { font-size: 28px; letter-spacing: .08em; margin: 8px 0; text-transform: uppercase; }
    .institution { font-size: 18px; color: #444; }
    .student { font-size: 32px; margin: 28px 0 12px; font-weight: bold; }
    .body { text-align: center; font-size: 16px; line-height: 1.6; max-width: 720px; margin: 0 auto; }
    .meta { margin-top: 36px; display: flex; justify-content: space-between; gap: 24px; font-size: 12px; }
    .qr { border: 1px solid #ccc; padding: 8px; text-align: center; min-width: 160px; }
    .qr-code { font-family: monospace; font-size: 11px; word-break: break-all; }
    .sigs { display: flex; gap: 32px; justify-content: center; margin-top: 32px; }
    .sig { text-align: center; min-width: 160px; }
    .sig-line { border-top: 1px solid #333; margin-bottom: 8px; }
    .muted { color: #666; font-size: 11px; }
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
        <div><strong>Verify</strong></div>
        <div class="qr-code">${input.verificationCode}</div>
        <div class="muted">${input.verificationUrl}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}
