import type {
  AssessmentGradingMethod,
  AssessmentLifecycleStatus,
  AssessmentAttemptStatus,
} from '@learnova/types';

/**
 * Pure Assessment Core helpers — no I/O.
 * Used by Assignments today; Labs / Quizzes / Exams tomorrow.
 */

export const ASSESSMENT_LIFECYCLE_TRANSITIONS: Record<
  AssessmentLifecycleStatus,
  AssessmentLifecycleStatus[]
> = {
  draft: ['published', 'archived'],
  published: ['closed', 'archived'],
  closed: ['published', 'archived'],
  archived: ['draft'],
};

export function canTransitionLifecycle(
  from: AssessmentLifecycleStatus,
  to: AssessmentLifecycleStatus,
): boolean {
  if (from === to) return false;
  return ASSESSMENT_LIFECYCLE_TRANSITIONS[from].includes(to);
}

export function isPastDue(dueDate: Date | null | undefined, now: Date = new Date()): boolean {
  if (!dueDate) return false;
  return now.getTime() > dueDate.getTime();
}

export function isPastClose(closeDate: Date | null | undefined, now: Date = new Date()): boolean {
  if (!closeDate) return false;
  return now.getTime() > closeDate.getTime();
}

export interface SubmissionWindowResult {
  allowed: boolean;
  late: boolean;
  reason?: string;
}

/**
 * Decides whether a learner may submit now, and whether the attempt is late.
 * Closed window always wins over allowLateSubmission.
 */
export function evaluateSubmissionWindow(input: {
  status: AssessmentLifecycleStatus;
  dueDate: Date | null;
  closeDate: Date | null;
  allowLateSubmission: boolean;
  now?: Date;
}): SubmissionWindowResult {
  const now = input.now ?? new Date();

  if (input.status !== 'published') {
    return { allowed: false, late: false, reason: 'Activity is not open for submissions' };
  }
  if (isPastClose(input.closeDate, now)) {
    return { allowed: false, late: false, reason: 'Submission window has closed' };
  }

  const late = isPastDue(input.dueDate, now);
  if (late && !input.allowLateSubmission) {
    return { allowed: false, late: true, reason: 'Late submissions are not allowed' };
  }

  return { allowed: true, late };
}

export interface AttemptCheckResult {
  allowed: boolean;
  nextAttempt: number;
  reason?: string;
}

export function evaluateAttempt(input: {
  previousAttempts: number;
  maxAttempts: number;
  allowResubmission: boolean;
}): AttemptCheckResult {
  const nextAttempt = input.previousAttempts + 1;

  if (input.previousAttempts > 0 && !input.allowResubmission) {
    return { allowed: false, nextAttempt, reason: 'Resubmission is not allowed' };
  }
  if (nextAttempt > input.maxAttempts) {
    return {
      allowed: false,
      nextAttempt,
      reason: `Maximum attempts (${String(input.maxAttempts)}) reached`,
    };
  }

  return { allowed: true, nextAttempt };
}

export function resolveAttemptStatus(late: boolean): AssessmentAttemptStatus {
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

export function resolveGradeOutcome(input: {
  gradingMethod: AssessmentGradingMethod;
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
  } else if (input.gradingMethod === 'auto') {
    marks = input.marksObtained ?? null;
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

export function extensionForContentType(contentType: string): string {
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

export {
  evaluateQuestionAnswer,
  scoreQuestionAttempt,
} from './question-evaluation.js';

export {
  renderQuestionForAttempt,
  renderQuestionForReview,
  selectQuestionsForActivity,
  type QuestionDocumentLike,
} from './question-renderer.js';

export {
  isTimedAttemptExpired,
  remainingAttemptSeconds,
  computeAttemptDurationSeconds,
  resolveTimedAttemptStatus,
  canStartQuestionAttempt,
  nextQuestionAttemptNumber,
} from './timed-attempt.js';

export {
  computeQuestionAccuracy,
  computePassRate,
  computeIncorrectRate,
  buildQuestionStatRow,
  rankMostIncorrectQuestions,
  computeAveragePercentage,
} from './question-analytics.js';

export {
  evaluateExamWindow,
  canCheckIn,
  canStartExamAttempt,
  validateSecureBrowser,
  evaluateProctorViolation,
  examinationEngine,
} from './examination-policies.js';

import { evaluateQuestionAnswer, scoreQuestionAttempt } from './question-evaluation.js';
import {
  renderQuestionForAttempt,
  renderQuestionForReview,
  selectQuestionsForActivity,
} from './question-renderer.js';
import {
  canStartQuestionAttempt,
  computeAttemptDurationSeconds,
  isTimedAttemptExpired,
  nextQuestionAttemptNumber,
  remainingAttemptSeconds,
  resolveTimedAttemptStatus,
} from './timed-attempt.js';

/**
 * Question-based assessment engine — reusable by Quiz (12) and Exam (13).
 * I/O-free: rendering, attempt lifecycle, auto-evaluation, scoring, analytics helpers.
 */
export const assessmentQuestionEngine = {
  evaluateQuestionAnswer,
  scoreQuestionAttempt,
  renderQuestionForAttempt,
  renderQuestionForReview,
  selectQuestionsForActivity,
  isTimedAttemptExpired,
  remainingAttemptSeconds,
  computeAttemptDurationSeconds,
  resolveTimedAttemptStatus,
  canStartQuestionAttempt,
  nextQuestionAttemptNumber,
};
