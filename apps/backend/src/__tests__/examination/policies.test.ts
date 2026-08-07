import { describe, expect, it } from 'vitest';
import {
  canCheckIn,
  canStartExamAttempt,
  canStartQuestionAttempt,
  evaluateExamWindow,
  evaluateProctorViolation,
  evaluateQuestionAnswer,
  examinationEngine,
  isTimedAttemptExpired,
  nextQuestionAttemptNumber,
  remainingAttemptSeconds,
  scoreQuestionAttempt,
  validateSecureBrowser,
} from '../../services/examination-engine/index.js';
import type { ExamProctoringPolicy, ExamSchedule } from '@learnova/types';

describe('examinationEngine composition', () => {
  it('re-exports assessment question engine methods', () => {
    expect(examinationEngine.evaluateQuestionAnswer).toBe(evaluateQuestionAnswer);
    expect(examinationEngine.scoreQuestionAttempt).toBe(scoreQuestionAttempt);
    expect(examinationEngine.canStartQuestionAttempt).toBe(canStartQuestionAttempt);
    expect(examinationEngine.nextQuestionAttemptNumber).toBe(nextQuestionAttemptNumber);
  });

  it('re-exports exam policy methods', () => {
    expect(examinationEngine.evaluateExamWindow).toBe(evaluateExamWindow);
    expect(examinationEngine.canCheckIn).toBe(canCheckIn);
    expect(examinationEngine.canStartExamAttempt).toBe(canStartExamAttempt);
    expect(examinationEngine.validateSecureBrowser).toBe(validateSecureBrowser);
    expect(examinationEngine.evaluateProctorViolation).toBe(evaluateProctorViolation);
  });
});

describe('evaluateExamWindow', () => {
  const schedule: ExamSchedule = {
    registrationOpensAt: '2026-09-01T06:00:00.000Z',
    registrationClosesAt: '2026-09-01T08:30:00.000Z',
    checkInOpensAt: '2026-09-01T08:30:00.000Z',
    startsAt: '2026-09-01T09:00:00.000Z',
    endsAt: '2026-09-01T12:00:00.000Z',
    lateEntryMinutes: 15,
    gracePeriodMinutes: 5,
  };

  it('allows registration phase', () => {
    const result = evaluateExamWindow(schedule, new Date('2026-09-01T07:00:00.000Z'));
    expect(result.allowed).toBe(true);
    expect(result.phase).toBe('registration');
  });

  it('allows check-in phase', () => {
    const result = evaluateExamWindow(schedule, new Date('2026-09-01T08:45:00.000Z'));
    expect(result.allowed).toBe(true);
    expect(result.phase).toBe('check_in');
  });

  it('allows active phase at start', () => {
    const result = evaluateExamWindow(schedule, new Date('2026-09-01T09:00:00.000Z'));
    expect(result.allowed).toBe(true);
    expect(result.phase).toBe('active');
  });

  it('blocks late entry after window closes', () => {
    const result = evaluateExamWindow(schedule, new Date('2026-09-01T09:20:00.000Z'));
    expect(result.allowed).toBe(false);
    expect(result.phase).toBe('closed');
  });

  it('allows grace period after end', () => {
    const result = evaluateExamWindow(schedule, new Date('2026-09-01T12:03:00.000Z'));
    expect(result.allowed).toBe(true);
    expect(result.phase).toBe('grace');
  });

  it('blocks after grace period', () => {
    const result = evaluateExamWindow(schedule, new Date('2026-09-01T12:10:00.000Z'));
    expect(result.allowed).toBe(false);
    expect(result.phase).toBe('closed');
  });
});

describe('validateSecureBrowser', () => {
  it('allows when policy is off', () => {
    expect(validateSecureBrowser('off', false).allowed).toBe(true);
  });

  it('allows recommended without acknowledgement', () => {
    const result = validateSecureBrowser('recommended', false);
    expect(result.allowed).toBe(true);
    expect(result.reason).toContain('recommended');
  });

  it('blocks required without acknowledgement', () => {
    const result = validateSecureBrowser('required', false);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('required');
  });

  it('allows required when acknowledged', () => {
    expect(validateSecureBrowser('required', true).allowed).toBe(true);
  });
});

describe('evaluateProctorViolation', () => {
  const policy: ExamProctoringPolicy = {
    mode: 'live',
    secureBrowser: 'required',
    requireWebcam: true,
    requireMicrophone: false,
    blockCopyPaste: true,
    blockRightClick: true,
    blockNewTabs: true,
    requireFullscreen: true,
    maxTabSwitches: 3,
    autoTerminateOnViolation: true,
    invigilatorIds: [],
  };

  it('does not terminate when mode is none', () => {
    expect(evaluateProctorViolation({ ...policy, mode: 'none' }, 5).terminate).toBe(false);
  });

  it('does not terminate below threshold', () => {
    expect(evaluateProctorViolation(policy, 2).terminate).toBe(false);
  });

  it('terminates when violations exceed max and auto-terminate enabled', () => {
    const result = evaluateProctorViolation(policy, 4);
    expect(result.terminate).toBe(true);
    expect(result.reason).toContain('3');
  });

  it('does not terminate when auto-terminate is disabled', () => {
    expect(
      evaluateProctorViolation({ ...policy, autoTerminateOnViolation: false }, 10).terminate,
    ).toBe(false);
  });
});

describe('examinationEngine question evaluation', () => {
  const question = {
    id: 'q1',
    questionType: 'single_choice' as const,
    marks: 4,
    negativeMarks: 1,
    options: [
      { id: 'a', isCorrect: true },
      { id: 'b', isCorrect: false },
    ],
    matchPairs: [],
    fillBlankAnswers: [],
  };

  it('evaluates a correct answer via examinationEngine', () => {
    const result = examinationEngine.evaluateQuestionAnswer(
      question,
      { questionId: 'q1', selectedOptionIds: ['a'], textAnswer: null, matchAnswers: {} },
      false,
    );
    expect(result.isCorrect).toBe(true);
    expect(result.marksAwarded).toBe(4);
  });

  it('scores an attempt via examinationEngine', () => {
    const result = examinationEngine.scoreQuestionAttempt(
      [question],
      [{ questionId: 'q1', selectedOptionIds: ['a'], textAnswer: null, matchAnswers: {} }],
      { passingMarks: 40, totalMarks: 100, negativeMarking: false },
    );
    expect(result.score).toBe(4);
    expect(result.correct).toBe(1);
  });

  it('detects expired timed attempts', () => {
    const startedAt = new Date(Date.now() - 31 * 60 * 1000);
    const ctx = {
      activityId: 'exam1',
      attemptId: 'attempt1',
      studentId: 'student1',
      startedAt,
      durationMinutes: 30,
    };
    expect(isTimedAttemptExpired(ctx)).toBe(true);
    expect(remainingAttemptSeconds(ctx)).toBe(0);
  });

  it('increments attempt numbers', () => {
    expect(nextQuestionAttemptNumber(0)).toBe(1);
    expect(canStartQuestionAttempt(0, 1)).toBe(true);
    expect(canStartQuestionAttempt(1, 1)).toBe(false);
  });
});
