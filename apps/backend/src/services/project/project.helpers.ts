import type {
  AssessmentGradingMethod,
  AssessmentLifecycleStatus,
  ProjectGradingMethod,
  ProjectStatus,
  ProjectSubmissionStatus,
} from '@learnova/types';
import {
  ASSESSMENT_ENROLLMENT_STATUSES,
  PROJECT_CSV_HEADERS,
  PROJECT_DEFAULT_MILESTONES,
} from '@learnova/constants';
import {
  applyLatePenalty,
  computePercentage,
  computeSubmissionRate,
  evaluateAttempt as evaluateAttemptCore,
  evaluateSubmissionWindow as evaluateSubmissionWindowCore,
  extensionForContentType,
  isPassing,
  isPastClose,
  isPastDue,
  resolveAttemptStatus,
  resolveGradeOutcome as resolveGradeOutcomeCore,
  rubricTotalPoints,
  type AttemptCheckResult,
  type GradeOutcome,
  type SubmissionWindowResult,
} from '@learnova/shared';

/**
 * Project helpers — thin adapters over Assessment Core.
 * Prefer importing primitives from `@learnova/shared` in new modules.
 */

/** @deprecated Prefer ASSESSMENT_ENROLLMENT_STATUSES from @learnova/constants */
export const ACTIVE_ENROLLMENT_STATUSES = ASSESSMENT_ENROLLMENT_STATUSES;

export const DEFAULT_PROJECT_MILESTONES = PROJECT_DEFAULT_MILESTONES;

export const PROJECT_STATUS_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  draft: ['published', 'archived'],
  published: ['open', 'closed', 'archived'],
  open: ['closed', 'archived'],
  closed: ['published', 'open', 'archived'],
  archived: ['draft'],
};

export function canTransitionStatus(from: ProjectStatus, to: ProjectStatus): boolean {
  if (from === to) return true;
  return PROJECT_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export {
  isPastDue,
  applyLatePenalty,
  computePercentage,
  isPassing,
  rubricTotalPoints,
  computeSubmissionRate,
};

export function isClosed(closeDate: Date | null | undefined, now: Date = new Date()): boolean {
  return isPastClose(closeDate, now);
}

export type SubmissionWindow = SubmissionWindowResult;
export type AttemptCheck = AttemptCheckResult;
export type { GradeOutcome };

export function evaluateSubmissionWindow(input: {
  status: ProjectStatus;
  dueDate: Date | null;
  closeDate: Date | null;
  allowLateSubmission: boolean;
  now?: Date;
}): SubmissionWindow {
  const result = evaluateSubmissionWindowCore({
    ...input,
    status: input.status as AssessmentLifecycleStatus,
  });
  if (result.reason === 'Activity is not open for submissions') {
    return { ...result, reason: 'Project is not open for submissions' };
  }
  if (result.reason === 'Submission window has closed') {
    return { ...result, reason: 'Project submission window has closed' };
  }
  return result;
}

export function evaluateAttempt(input: {
  previousAttempts: number;
  maxAttempts: number;
  allowResubmission: boolean;
}): AttemptCheck {
  return evaluateAttemptCore(input);
}

export function resolveSubmissionStatus(late: boolean): ProjectSubmissionStatus {
  return resolveAttemptStatus(late) as ProjectSubmissionStatus;
}

export function resolveGradeOutcome(input: {
  gradingMethod: ProjectGradingMethod;
  marksObtained?: number | null;
  percentage?: number | null;
  passed?: boolean | null;
  rubricScores?: { points: number }[];
  totalMarks: number;
  passingMarks: number;
  late: boolean;
  latePenaltyPercent: number;
}): GradeOutcome {
  return resolveGradeOutcomeCore({
    ...input,
    gradingMethod: input.gradingMethod as AssessmentGradingMethod,
  });
}

export function pageMeta(total: number, page: number, limit: number) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

export function toIso(value: unknown): string | null {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' && value) return new Date(value).toISOString();
  return null;
}

export function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export { PROJECT_CSV_HEADERS };

export function escapeCsv(value: unknown): string {
  let str: string;
  if (value == null) {
    str = '';
  } else if (typeof value === 'object') {
    str = JSON.stringify(value);
  } else {
    str = String(value);
  }
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export function rowsToCsv(
  rows: Record<string, unknown>[],
  headers: readonly string[] = PROJECT_CSV_HEADERS,
): string {
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCsv(row[h])).join(','));
  }
  return `${lines.join('\n')}\n`;
}

export function extensionFor(contentType: string): string {
  return extensionForContentType(contentType);
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export async function ensureUniqueProjectSlug(
  _institutionId: string,
  baseSlug: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  let slug = baseSlug;
  let suffix = 0;
  while (await exists(slug)) {
    suffix += 1;
    slug = `${baseSlug}-${String(suffix)}`;
  }
  return slug;
}
