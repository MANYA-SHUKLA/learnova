import type { ExamProctoringPolicy, ExamSchedule, SecureBrowserPolicy } from '@learnova/types';
import { evaluateQuestionAnswer, scoreQuestionAttempt } from './question-evaluation.js';
import {
  renderQuestionForAttempt,
  renderQuestionForReview,
  selectQuestionsForActivity,
} from './question-renderer.js';
export { selectQuestionsByBlueprint } from './blueprint-selection.js';
import { selectQuestionsByBlueprint } from './blueprint-selection.js';
import {
  canStartQuestionAttempt,
  computeAttemptDurationSeconds,
  isTimedAttemptExpired,
  nextQuestionAttemptNumber,
  remainingAttemptSeconds,
  resolveTimedAttemptStatus,
} from './timed-attempt.js';

export interface ExamWindowResult {
  allowed: boolean;
  phase: 'registration' | 'check_in' | 'active' | 'grace' | 'closed';
  reason?: string;
}

export interface SecureBrowserCheck {
  allowed: boolean;
  reason?: string;
}

export interface ProctorViolationResult {
  terminate: boolean;
  reason?: string;
}

export function evaluateExamWindow(
  schedule: ExamSchedule,
  now: Date = new Date(),
): ExamWindowResult {
  const t = now.getTime();
  const starts = new Date(schedule.startsAt).getTime();
  const ends = new Date(schedule.endsAt).getTime();
  const graceEnd = ends + schedule.gracePeriodMinutes * 60 * 1000;
  const lateStart = starts + schedule.lateEntryMinutes * 60 * 1000;

  if (schedule.registrationOpensAt) {
    const regOpen = new Date(schedule.registrationOpensAt).getTime();
    const regClose = schedule.registrationClosesAt
      ? new Date(schedule.registrationClosesAt).getTime()
      : starts;
    if (t >= regOpen && t < regClose) {
      return { allowed: true, phase: 'registration' };
    }
  }

  if (schedule.checkInOpensAt) {
    const checkInOpen = new Date(schedule.checkInOpensAt).getTime();
    if (t >= checkInOpen && t < starts) {
      return { allowed: true, phase: 'check_in' };
    }
  }

  if (t >= starts && t <= lateStart) {
    return { allowed: true, phase: 'active' };
  }

  if (t > lateStart && t <= ends) {
    return { allowed: false, phase: 'closed', reason: 'Late entry window has closed' };
  }

  if (t > ends && t <= graceEnd) {
    return { allowed: true, phase: 'grace' };
  }

  if (t > graceEnd) {
    return { allowed: false, phase: 'closed', reason: 'Exam window has closed' };
  }

  if (t < starts) {
    return { allowed: false, phase: 'closed', reason: 'Exam has not started yet' };
  }

  return { allowed: false, phase: 'closed', reason: 'Exam is not available' };
}

export function canCheckIn(schedule: ExamSchedule, now: Date = new Date()): boolean {
  const window = evaluateExamWindow(schedule, now);
  return window.phase === 'check_in' || window.phase === 'registration';
}

export function canStartExamAttempt(schedule: ExamSchedule, now: Date = new Date()): ExamWindowResult {
  const window = evaluateExamWindow(schedule, now);
  if (window.phase === 'active' || window.phase === 'grace') {
    return { allowed: true, phase: window.phase };
  }
  return window;
}

export function validateSecureBrowser(
  policy: SecureBrowserPolicy,
  acknowledged: boolean,
): SecureBrowserCheck {
  if (policy === 'off') return { allowed: true };
  if (policy === 'recommended' && !acknowledged) {
    return { allowed: true, reason: 'Secure browser recommended but not acknowledged' };
  }
  if (policy === 'required' && !acknowledged) {
    return { allowed: false, reason: 'Secure browser is required for this exam' };
  }
  return { allowed: true };
}

export function evaluateProctorViolation(
  policy: ExamProctoringPolicy,
  violationCount: number,
): ProctorViolationResult {
  if (policy.mode === 'none') return { terminate: false };
  if (policy.maxTabSwitches <= 0) return { terminate: false };
  if (violationCount > policy.maxTabSwitches && policy.autoTerminateOnViolation) {
    return {
      terminate: true,
      reason: `Maximum violations (${policy.maxTabSwitches}) exceeded`,
    };
  }
  return { terminate: false };
}

/**
 * Examination policy layer — composes Assessment Core question engine.
 * DO NOT duplicate evaluation, scoring, or rendering logic here.
 */
export const examinationEngine = {
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
  evaluateExamWindow,
  canCheckIn,
  canStartExamAttempt,
  validateSecureBrowser,
  evaluateProctorViolation,
  selectQuestionsByBlueprint,
};
