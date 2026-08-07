import type {
  AssessmentLifecycleStatus,
  ExecutionStatus,
  PracticeLabStatus,
  PracticeLanguage,
  SubmissionVerdict,
} from '@learnova/types';
import {
  ASSESSMENT_ENROLLMENT_STATUSES,
  PRACTICE_LANGUAGE_META,
  PRACTICE_LANGUAGES,
} from '@learnova/constants';
import {
  canTransitionLifecycle,
  evaluateAttempt as evaluateAttemptCore,
  type AttemptCheckResult,
} from '@learnova/shared';

/** @deprecated Prefer ASSESSMENT_ENROLLMENT_STATUSES */
export const ACTIVE_ENROLLMENT_STATUSES = ASSESSMENT_ENROLLMENT_STATUSES;

export function canTransitionStatus(from: PracticeLabStatus, to: PracticeLabStatus): boolean {
  return canTransitionLifecycle(
    from as AssessmentLifecycleStatus,
    to as AssessmentLifecycleStatus,
  );
}

export type AttemptCheck = AttemptCheckResult;

export function evaluateAttempt(input: {
  previousAttempts: number;
  maxAttempts: number;
  allowResubmission: boolean;
}): AttemptCheck {
  return evaluateAttemptCore(input);
}

export function normalizeOutput(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+$/g, ''))
    .join('\n')
    .replace(/\n+$/g, '');
}

export function outputsMatch(
  actual: string | null | undefined,
  expected: string | null | undefined,
): boolean {
  return normalizeOutput(actual) === normalizeOutput(expected);
}

export function computeSubmissionScore(
  results: { passed: boolean; weight: number; status: ExecutionStatus }[],
): {
  score: number;
  maxScore: number;
  passedCount: number;
  totalCount: number;
  verdict: SubmissionVerdict;
} {
  const totalCount = results.length;
  const passedCount = results.filter((r) => r.passed).length;
  const maxScore = results.reduce((sum, r) => sum + r.weight, 0);
  const score = results.reduce((sum, r) => sum + (r.passed ? r.weight : 0), 0);

  if (totalCount === 0) {
    return { score: 0, maxScore: 0, passedCount: 0, totalCount: 0, verdict: 'failed' };
  }

  const hasCompile = results.some((r) => r.status === 'compilation_error');
  if (hasCompile) {
    return { score: 0, maxScore, passedCount: 0, totalCount, verdict: 'compilation_error' };
  }

  if (passedCount === totalCount) {
    return { score, maxScore, passedCount, totalCount, verdict: 'accepted' };
  }

  if (passedCount === 0) {
    const firstFail = results.find((r) => !r.passed);
    const status = firstFail?.status;
    if (status === 'runtime_error') {
      return { score, maxScore, passedCount, totalCount, verdict: 'runtime_error' };
    }
    if (status === 'time_limit_exceeded') {
      return { score, maxScore, passedCount, totalCount, verdict: 'time_limit_exceeded' };
    }
    if (status === 'memory_limit_exceeded') {
      return { score, maxScore, passedCount, totalCount, verdict: 'memory_limit_exceeded' };
    }
    return { score, maxScore, passedCount, totalCount, verdict: 'wrong_answer' };
  }

  return { score, maxScore, passedCount, totalCount, verdict: 'partial' };
}

export function slugifyProblemTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || 'problem';
}

export function defaultBoilerplates(languages: PracticeLanguage[]) {
  return languages.map((language) => ({
    language,
    code: PRACTICE_LANGUAGE_META[language].defaultBoilerplate,
  }));
}

export function allLanguageCatalog() {
  return PRACTICE_LANGUAGES.map((key, order) => ({
    key,
    name: PRACTICE_LANGUAGE_META[key].name,
    monacoLanguage: PRACTICE_LANGUAGE_META[key].monacoLanguage,
    version: PRACTICE_LANGUAGE_META[key].version,
    judge0Id: 0,
    enabled: true,
    order,
  }));
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

export function escapeCsv(value: unknown): string {
  let str: string;
  if (value == null) str = '';
  else if (typeof value === 'object') str = JSON.stringify(value);
  else str = String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export function rowsToCsv(rows: Record<string, unknown>[], headers: readonly string[]): string {
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCsv(row[h])).join(','));
  }
  return `${lines.join('\n')}\n`;
}

export const PRACTICE_LAB_CSV_HEADERS = [
  'id',
  'courseId',
  'title',
  'difficulty',
  'status',
  'languages',
  'problemCount',
  'createdAt',
] as const;
