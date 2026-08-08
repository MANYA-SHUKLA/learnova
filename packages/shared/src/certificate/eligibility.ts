import type { CertificateDocumentType } from '@learnova/types';
import { CERTIFICATE_ACTIVITY_KIND_MAP, CERTIFICATE_GRADUATION_STANDINGS } from '@learnova/constants';

/**
 * Certificate Eligibility Engine (pure rules)
 *
 * Checks eligibility ONLY from:
 * - Published gradebook records (`published`, `result`, gradebook entries)
 * - Institutional policy (already applied by gradebook — read stored outcomes)
 * - Academic standing (from gradebook `AcademicStanding`, never recomputed)
 * - Completion requirements (enrollment coverage, activity presence)
 *
 * MUST NOT calculate marks, percentages, letter grades, GPA, CGPA, or standing.
 * Those remain owned exclusively by the Gradebook module.
 */

export interface PublishedCourseGrade {
  published: boolean;
  result: string | null;
  moderationStage?: string | null;
}

export interface GradebookEntryFact {
  activityKind: string;
  activityId?: string | null;
  passed?: boolean | null;
  status?: string;
}

export interface StandingRecord {
  standing: string;
}

export function normalizeDocumentType(type: CertificateDocumentType): CertificateDocumentType {
  if (type === 'honors' || type === 'distinction') return 'merit';
  if (type === 'semester_record') return 'semester_completion';
  return type;
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

export function isActivityCompletionEligible(
  summary: PublishedCourseGrade,
  entries: GradebookEntryFact[],
  activityKind: string,
  activityId?: string | null,
): { eligible: boolean; reasons: string[] } {
  const base = isCourseCompletionEligible(summary);
  if (!base.eligible) return base;

  const matching = entries.filter((entry) => {
    if (entry.status === 'superseded' || entry.status === 'pending') return false;
    if (entry.activityKind !== activityKind) return false;
    if (activityId && entry.activityId && entry.activityId !== activityId) return false;
    return true;
  });

  if (matching.length === 0) {
    return {
      eligible: false,
      reasons: [`No published gradebook entry found for ${activityKind} activity`],
    };
  }

  return { eligible: true, reasons: [] };
}

export function activityKindForDocumentType(type: CertificateDocumentType): string | null {
  const normalized = normalizeDocumentType(type);
  return (
    CERTIFICATE_ACTIVITY_KIND_MAP[normalized as keyof typeof CERTIFICATE_ACTIVITY_KIND_MAP] ?? null
  );
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

export function isProgramCompletionEligible(
  summaries: PublishedCourseGrade[],
  requiredCourseCount: number,
): { eligible: boolean; reasons: string[] } {
  const publishedPass = summaries.filter((row) => row.published && row.result === 'pass');
  if (publishedPass.length < requiredCourseCount) {
    return {
      eligible: false,
      reasons: ['Not all program courses have published passing grades'],
    };
  }
  return { eligible: true, reasons: [] };
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

export function isMeritCertificateEligible(standing: StandingRecord | null): {
  eligible: boolean;
  reasons: string[];
} {
  if (!standing) {
    return { eligible: false, reasons: ['Academic standing has not been recorded by gradebook'] };
  }
  if (!['honors', 'distinction', 'merit'].includes(standing.standing)) {
    return { eligible: false, reasons: ['Student does not meet merit standing requirements'] };
  }
  return { eligible: true, reasons: [] };
}

/** @deprecated use isMeritCertificateEligible with document-type checks at issue time */
export function isStandingCertificateEligible(
  documentType: Extract<CertificateDocumentType, 'honors' | 'distinction' | 'merit'>,
  standing: StandingRecord | null,
): { eligible: boolean; reasons: string[] } {
  const base = isMeritCertificateEligible(standing);
  if (!base.eligible) return base;
  if (documentType === 'honors' && standing!.standing !== 'honors') {
    return { eligible: false, reasons: ['Honors certificate requires honors standing'] };
  }
  if (documentType === 'distinction' && standing!.standing !== 'distinction') {
    return { eligible: false, reasons: ['Distinction certificate requires distinction standing'] };
  }
  return { eligible: true, reasons: [] };
}

export function isParticipationEligible(summary: PublishedCourseGrade): {
  eligible: boolean;
  reasons: string[];
} {
  if (!summary.published) {
    return { eligible: false, reasons: ['Course grade is not published'] };
  }
  return { eligible: true, reasons: [] };
}

export function isCustomCertificateEligible(summary: PublishedCourseGrade | null): {
  eligible: boolean;
  reasons: string[];
} {
  if (!summary?.published) {
    return { eligible: false, reasons: ['A published gradebook record is required for custom certificates'] };
  }
  return { eligible: true, reasons: [] };
}

/** Graduation eligibility uses standing already computed by gradebook under institution policy */
export function isGraduationCertificateEligible(
  standing: StandingRecord | null,
  allowedStandings: readonly string[] = CERTIFICATE_GRADUATION_STANDINGS,
): { eligible: boolean; reasons: string[] } {
  if (!standing) {
    return { eligible: false, reasons: ['Academic standing has not been computed by gradebook'] };
  }
  if (!allowedStandings.includes(standing.standing)) {
    return {
      eligible: false,
      reasons: [
        `Graduation requires standing in: ${allowedStandings.join(', ')} (current: ${standing.standing})`,
      ],
    };
  }
  return { eligible: true, reasons: [] };
}
