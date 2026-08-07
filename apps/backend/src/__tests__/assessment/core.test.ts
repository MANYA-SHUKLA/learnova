import { describe, expect, it } from 'vitest';
import {
  applyLatePenalty,
  canTransitionLifecycle,
  computePercentage,
  evaluateAttempt,
  evaluateSubmissionWindow,
  resolveGradeOutcome,
  resolveAttemptStatus,
} from '@learnova/shared';

describe('Assessment Core — lifecycle', () => {
  it('allows draft → published', () => {
    expect(canTransitionLifecycle('draft', 'published')).toBe(true);
  });

  it('rejects published → draft', () => {
    expect(canTransitionLifecycle('published', 'draft')).toBe(false);
  });
});

describe('Assessment Core — deadlines', () => {
  const due = new Date('2026-01-01T12:00:00.000Z');
  const close = new Date('2026-01-10T12:00:00.000Z');

  it('blocks non-published activities', () => {
    const r = evaluateSubmissionWindow({
      status: 'draft',
      dueDate: due,
      closeDate: close,
      allowLateSubmission: true,
      now: new Date('2026-01-02T00:00:00.000Z'),
    });
    expect(r.allowed).toBe(false);
  });

  it('marks late when past due but still open', () => {
    const r = evaluateSubmissionWindow({
      status: 'published',
      dueDate: due,
      closeDate: close,
      allowLateSubmission: true,
      now: new Date('2026-01-02T00:00:00.000Z'),
    });
    expect(r).toEqual({ allowed: true, late: true });
    expect(resolveAttemptStatus(true)).toBe('late');
  });

  it('rejects late when not allowed', () => {
    const r = evaluateSubmissionWindow({
      status: 'published',
      dueDate: due,
      closeDate: close,
      allowLateSubmission: false,
      now: new Date('2026-01-02T00:00:00.000Z'),
    });
    expect(r.allowed).toBe(false);
    expect(r.late).toBe(true);
  });

  it('rejects after closeDate', () => {
    const r = evaluateSubmissionWindow({
      status: 'published',
      dueDate: due,
      closeDate: close,
      allowLateSubmission: true,
      now: new Date('2026-01-11T00:00:00.000Z'),
    });
    expect(r.allowed).toBe(false);
  });
});

describe('Assessment Core — attempts', () => {
  it('allows first attempt', () => {
    expect(
      evaluateAttempt({ previousAttempts: 0, maxAttempts: 1, allowResubmission: false }),
    ).toMatchObject({ allowed: true, nextAttempt: 1 });
  });

  it('blocks resubmission when disabled', () => {
    expect(
      evaluateAttempt({ previousAttempts: 1, maxAttempts: 3, allowResubmission: false }).allowed,
    ).toBe(false);
  });

  it('enforces maxAttempts', () => {
    expect(
      evaluateAttempt({ previousAttempts: 2, maxAttempts: 2, allowResubmission: true }).allowed,
    ).toBe(false);
  });
});

describe('Assessment Core — grading', () => {
  it('computes percentage and pass', () => {
    expect(computePercentage(40, 100)).toBe(40);
    const outcome = resolveGradeOutcome({
      gradingMethod: 'marks',
      marksObtained: 80,
      totalMarks: 100,
      passingMarks: 40,
      late: false,
      latePenaltyPercent: 0,
    });
    expect(outcome).toEqual({ marksObtained: 80, percentage: 80, passed: true });
  });

  it('applies late penalty', () => {
    expect(applyLatePenalty(100, 10)).toBe(90);
    const outcome = resolveGradeOutcome({
      gradingMethod: 'marks',
      marksObtained: 100,
      totalMarks: 100,
      passingMarks: 40,
      late: true,
      latePenaltyPercent: 10,
    });
    expect(outcome.marksObtained).toBe(90);
  });

  it('sums rubric scores', () => {
    const outcome = resolveGradeOutcome({
      gradingMethod: 'rubric',
      rubricScores: [{ points: 4 }, { points: 6 }],
      totalMarks: 10,
      passingMarks: 5,
      late: false,
      latePenaltyPercent: 0,
    });
    expect(outcome.marksObtained).toBe(10);
    expect(outcome.passed).toBe(true);
  });
});
