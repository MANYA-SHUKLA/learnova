import type {
  AssignmentGradingMethod,
  AssignmentStatus,
  AssignmentSubmissionStatus,
} from '@learnova/types';

/** Enrollment states that grant a student access to a course's assignments. */
export const ACTIVE_ENROLLMENT_STATUSES = ['active', 'approved', 'completed'] as const;

/** Allowed assignment lifecycle moves. Anything else is rejected. */
export const ASSIGNMENT_STATUS_TRANSITIONS: Record<AssignmentStatus, AssignmentStatus[]> = {
  draft: ['published', 'archived'],
  published: ['closed', 'archived'],
  closed: ['published', 'archived'],
  archived: ['draft'],
};

export function canTransitionStatus(from: AssignmentStatus, to: AssignmentStatus): boolean {
  if (from === to) return false;
  return ASSIGNMENT_STATUS_TRANSITIONS[from].includes(to);
}

export function isPastDue(dueDate: Date | null | undefined, now: Date = new Date()): boolean {
  if (!dueDate) return false;
  return now.getTime() > dueDate.getTime();
}

export function isClosed(closeDate: Date | null | undefined, now: Date = new Date()): boolean {
  if (!closeDate) return false;
  return now.getTime() > closeDate.getTime();
}

export interface SubmissionWindow {
  allowed: boolean;
  late: boolean;
  reason?: string;
}

/**
 * Decides whether a student may submit right now, and whether the attempt
 * counts as late. A closed window always wins over the late-submission flag.
 */
export function evaluateSubmissionWindow(input: {
  status: AssignmentStatus;
  dueDate: Date | null;
  closeDate: Date | null;
  allowLateSubmission: boolean;
  now?: Date;
}): SubmissionWindow {
  const now = input.now ?? new Date();

  if (input.status !== 'published') {
    return { allowed: false, late: false, reason: 'Assignment is not open for submissions' };
  }
  if (isClosed(input.closeDate, now)) {
    return { allowed: false, late: false, reason: 'Assignment submission window has closed' };
  }

  const late = isPastDue(input.dueDate, now);
  if (late && !input.allowLateSubmission) {
    return { allowed: false, late: true, reason: 'Late submissions are not allowed' };
  }

  return { allowed: true, late };
}

export interface AttemptCheck {
  allowed: boolean;
  nextAttempt: number;
  reason?: string;
}

export function evaluateAttempt(input: {
  previousAttempts: number;
  maxAttempts: number;
  allowResubmission: boolean;
}): AttemptCheck {
  const nextAttempt = input.previousAttempts + 1;

  if (input.previousAttempts > 0 && !input.allowResubmission) {
    return { allowed: false, nextAttempt, reason: 'Resubmission is not allowed' };
  }
  if (nextAttempt > input.maxAttempts) {
    return {
      allowed: false,
      nextAttempt,
      reason: `Maximum attempts (${input.maxAttempts}) reached`,
    };
  }

  return { allowed: true, nextAttempt };
}

export function resolveSubmissionStatus(late: boolean): AssignmentSubmissionStatus {
  return late ? 'late' : 'submitted';
}

export function applyLatePenalty(marks: number, penaltyPercent: number): number {
  if (!Number.isFinite(marks) || marks <= 0) return Math.max(0, marks || 0);
  const penalty = Math.min(100, Math.max(0, penaltyPercent));
  return Math.round(marks * (1 - penalty / 100) * 100) / 100;
}

export function computePercentage(marksObtained: number, totalMarks: number): number {
  if (totalMarks <= 0) return 0;
  const pct = (marksObtained / totalMarks) * 100;
  return Math.round(Math.max(0, Math.min(100, pct)) * 100) / 100;
}

export function isPassing(marksObtained: number, passingMarks: number): boolean {
  return marksObtained >= passingMarks;
}

export interface GradeOutcome {
  marksObtained: number | null;
  percentage: number | null;
  passed: boolean | null;
}

/**
 * Normalizes a grading payload into marks / percentage / pass across all
 * grading methods so downstream analytics can rely on a single shape.
 */
export function resolveGradeOutcome(input: {
  gradingMethod: AssignmentGradingMethod;
  marksObtained?: number | null;
  percentage?: number | null;
  passed?: boolean | null;
  rubricScores?: { points: number }[];
  totalMarks: number;
  passingMarks: number;
  late: boolean;
  latePenaltyPercent: number;
}): GradeOutcome {
  let marks: number | null = null;

  if (input.gradingMethod === 'rubric') {
    const scores = input.rubricScores ?? [];
    marks = scores.reduce((sum, s) => sum + (Number.isFinite(s.points) ? s.points : 0), 0);
  } else if (input.gradingMethod === 'percentage') {
    marks =
      input.percentage == null
        ? null
        : Math.round((input.percentage / 100) * input.totalMarks * 100) / 100;
  } else if (input.gradingMethod === 'pass_fail') {
    if (input.passed == null) {
      return { marksObtained: null, percentage: null, passed: null };
    }
    marks = input.passed ? input.totalMarks : 0;
  } else {
    marks = input.marksObtained ?? null;
  }

  if (marks == null) {
    return { marksObtained: null, percentage: null, passed: input.passed ?? null };
  }

  const penalized = input.late ? applyLatePenalty(marks, input.latePenaltyPercent) : marks;
  const capped = Math.max(0, Math.min(input.totalMarks, penalized));
  const percentage = computePercentage(capped, input.totalMarks);
  const passed =
    input.gradingMethod === 'pass_fail'
      ? (input.passed ?? isPassing(capped, input.passingMarks))
      : isPassing(capped, input.passingMarks);

  return { marksObtained: capped, percentage, passed };
}

export function rubricTotalPoints(criteria: { maxPoints: number }[]): number {
  return criteria.reduce((sum, c) => sum + (Number.isFinite(c.maxPoints) ? c.maxPoints : 0), 0);
}

export function computeSubmissionRate(submissions: number, expected: number): number {
  if (expected <= 0) return 0;
  return Math.round(Math.min(100, (submissions / expected) * 100) * 100) / 100;
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

export const ASSIGNMENT_CSV_HEADERS = [
  'id',
  'courseId',
  'title',
  'assignmentType',
  'status',
  'totalMarks',
  'passingMarks',
  'weightage',
  'dueDate',
  'closeDate',
  'createdAt',
] as const;

export function escapeCsv(value: unknown): string {
  const str = value == null ? '' : String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export function rowsToCsv(
  rows: Record<string, unknown>[],
  headers: readonly string[] = ASSIGNMENT_CSV_HEADERS,
): string {
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCsv(row[h])).join(','));
  }
  return `${lines.join('\n')}\n`;
}

/** File extension for a whitelisted upload content type. */
export function extensionFor(contentType: string): string {
  const map: Record<string, string> = {
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/zip': 'zip',
    'application/x-zip-compressed': 'zip',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
  };
  return map[contentType] ?? 'bin';
}
