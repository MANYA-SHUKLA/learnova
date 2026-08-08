import { CERTIFICATE_DEFAULTS } from '@learnova/constants';

export function formatCertificateNumber(
  prefix: string,
  year: number,
  sequence: number,
  segment = CERTIFICATE_DEFAULTS.NUMBER_SEGMENT,
): string {
  const padded = String(sequence).padStart(7, '0');
  return `${prefix}-${year}-${segment}-${padded}`;
}

export function buildVerificationUrl(baseUrl: string, verificationCode: string): string {
  const base = baseUrl.replace(/\/$/, '');
  return `${base}${CERTIFICATE_DEFAULTS.VERIFICATION_BASE_PATH}/${verificationCode}`;
}

export function buildPublicCertificateUrl(baseUrl: string, certificateNumber: string): string {
  const base = baseUrl.replace(/\/$/, '');
  return `${base}${CERTIFICATE_DEFAULTS.PUBLIC_CERTIFICATE_PATH}/${encodeURIComponent(certificateNumber)}`;
}
