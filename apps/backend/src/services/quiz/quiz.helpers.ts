import type { AssessmentLifecycleStatus, QuizStatus } from '@learnova/types';
import { ASSESSMENT_ENROLLMENT_STATUSES } from '@learnova/constants';
import {
  canTransitionLifecycle,
  computePercentage,
  extensionForContentType,
  isPassing,
  isPastClose,
} from '@learnova/shared';

/** @deprecated Prefer ASSESSMENT_ENROLLMENT_STATUSES from @learnova/constants */
export const ACTIVE_ENROLLMENT_STATUSES = ASSESSMENT_ENROLLMENT_STATUSES;

export const QUIZ_STATUS_TRANSITIONS: Record<QuizStatus, QuizStatus[]> = {
  draft: ['published', 'archived'],
  published: ['closed', 'archived'],
  closed: ['published', 'archived'],
  archived: ['draft'],
};

export function canTransitionStatus(from: QuizStatus, to: QuizStatus): boolean {
  return canTransitionLifecycle(
    from as AssessmentLifecycleStatus,
    to as AssessmentLifecycleStatus,
  );
}

export { computePercentage, isPassing };

export function isClosed(closeDate: Date | null | undefined, now: Date = new Date()): boolean {
  return isPastClose(closeDate, now);
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

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export async function ensureUniqueQuizSlug(
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

export const QUIZ_CSV_HEADERS = [
  'id',
  'courseId',
  'title',
  'quizType',
  'status',
  'difficulty',
  'totalMarks',
  'passingMarks',
  'durationMinutes',
  'attemptLimit',
  'publishDate',
  'closeDate',
  'createdAt',
] as const;

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
  headers: readonly string[] = QUIZ_CSV_HEADERS,
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
