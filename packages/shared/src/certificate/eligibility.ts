import type { CertificateDocumentType } from '@learnova/types';

export interface PublishedCourseGrade {
  published: boolean;
  result: string | null;
  moderationStage?: string | null;
}

export interface StandingRecord {
  standing: string;
}

export function isCourseCompletionEligible(
  summary: PublishedCourseGrade,
  certificateEnabled = true,
): { eligible: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (!certificateEnabled) reasons.push('Course certificates are disabled for this course');
  if (!summary.published) reasons.push('Course grade is not published');
  if (summary.result !== 'pass') reasons.push('Student did not pass the course');
  return { eligible: reasons.length === 0, reasons };
}

export function isSemesterRecordEligible(
  summaries: PublishedCourseGrade[],
  expectedCourseCount: number,
): { eligible: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const published = summaries.filter((row) => row.published);
  if (published.length === 0) reasons.push('No published grades for this semester');
  if (published.length < expectedCourseCount) {
    reasons.push('Not all enrolled courses have published grades');
  }
  const failed = published.filter((row) => row.result === 'fail');
  if (failed.length > 0) reasons.push('Semester includes failed courses');
  return { eligible: reasons.length === 0, reasons };
}

export function isTranscriptEligible(summaries: PublishedCourseGrade[]): {
  eligible: boolean;
  reasons: string[];
} {
  const published = summaries.filter((row) => row.published);
  if (published.length === 0) {
    return { eligible: false, reasons: ['No published grades available for transcript'] };
  }
  return { eligible: true, reasons: [] };
}

export function isStandingCertificateEligible(
  documentType: Extract<CertificateDocumentType, 'honors' | 'distinction'>,
  standing: StandingRecord | null,
): { eligible: boolean; reasons: string[] } {
  if (!standing) {
    return { eligible: false, reasons: ['Academic standing has not been computed'] };
  }
  if (documentType === 'honors' && standing.standing !== 'honors') {
    return { eligible: false, reasons: ['Student is not in honors standing'] };
  }
  if (documentType === 'distinction' && standing.standing !== 'distinction') {
    return { eligible: false, reasons: ['Student is not in distinction standing'] };
  }
  return { eligible: true, reasons: [] };
}
