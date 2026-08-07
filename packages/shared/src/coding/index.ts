import type { ExecutionStatus, SubmissionVerdict } from '@learnova/types';

/**
 * Pure coding-engine scoring helpers — no I/O.
 * Shared by Practice Labs today and Coding Exams later.
 */

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

export function mapJudge0StatusToExecutionStatus(statusId: number): ExecutionStatus {
  if (statusId === 1) return 'queued';
  if (statusId === 2) return 'running';
  if (statusId === 3) return 'accepted';
  if (statusId === 4) return 'wrong_answer';
  if (statusId === 5) return 'time_limit_exceeded';
  if (statusId === 6) return 'compilation_error';
  if (statusId >= 7 && statusId <= 12) return 'runtime_error';
  if (statusId === 13 || statusId === 14) return 'internal_error';
  return 'internal_error';
}

export function verdictToExecutionStatus(
  verdict: SubmissionVerdict,
): ExecutionStatus {
  if (verdict === 'accepted') return 'accepted';
  if (verdict === 'compilation_error') return 'compilation_error';
  if (verdict === 'runtime_error') return 'runtime_error';
  if (verdict === 'time_limit_exceeded') return 'time_limit_exceeded';
  if (verdict === 'memory_limit_exceeded') return 'memory_limit_exceeded';
  if (verdict === 'pending') return 'queued';
  return 'wrong_answer';
}
