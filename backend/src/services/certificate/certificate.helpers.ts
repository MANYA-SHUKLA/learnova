import { CERTIFICATE_DEFAULTS } from '@learnova/constants';
import { formatCertificateNumber } from '@learnova/shared';
import { CertificateNumberSequenceModel } from '../../models/certificate-number-sequence.model.js';
import { oid } from '../../repositories/certificate/certificate.repository.js';

export function getPublicBaseUrl(): string {
  return (
    process.env.PUBLIC_APP_URL ??
    process.env.FRONTEND_URL ??
    process.env.APP_URL ??
    'http://localhost:3000'
  );
}

export async function allocateCertificateNumber(
  institutionId: string,
  prefix?: string | null,
): Promise<string> {
  const year = new Date().getFullYear();
  const resolvedPrefix = prefix ?? CERTIFICATE_DEFAULTS.NUMBER_PREFIX;
  const row = await CertificateNumberSequenceModel.findOneAndUpdate(
    { institutionId: oid(institutionId), year, prefix: resolvedPrefix },
    { $inc: { sequence: 1 }, $setOnInsert: { segment: CERTIFICATE_DEFAULTS.NUMBER_SEGMENT } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).exec();

  return formatCertificateNumber(resolvedPrefix, year, row.sequence, row.segment);
}

export async function allocateTranscriptNumber(institutionId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `${CERTIFICATE_DEFAULTS.NUMBER_PREFIX}-TRN`;
  const row = await CertificateNumberSequenceModel.findOneAndUpdate(
    { institutionId: oid(institutionId), year, prefix },
    { $inc: { sequence: 1 }, $setOnInsert: { segment: 'TRN' } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).exec();

  return formatCertificateNumber(CERTIFICATE_DEFAULTS.NUMBER_PREFIX, year, row.sequence, 'TRN');
}

export function rowsToCsv(headers: string[], rows: Array<Record<string, unknown>>): string {
  const escape = (value: unknown): string => {
    const str = value == null ? '' : String(value);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(','));
  }
  return lines.join('\n');
}
