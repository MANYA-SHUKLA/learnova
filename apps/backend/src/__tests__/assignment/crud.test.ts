import { describe, expect, it } from 'vitest';
import {
  applyLatePenalty,
  canTransitionStatus,
  computePercentage,
  computeSubmissionRate,
  evaluateAttempt,
  evaluateSubmissionWindow,
  extensionFor,
  isPassing,
  isPastDue,
  pageMeta,
  parseDate,
  resolveGradeOutcome,
  resolveSubmissionStatus,
  rowsToCsv,
  rubricTotalPoints,
} from '../../services/assignment/assignment.helpers.js';

const NOW = new Date('2026-08-07T12:00:00.000Z');
const YESTERDAY = new Date('2026-08-06T12:00:00.000Z');
const TOMORROW = new Date('2026-08-08T12:00:00.000Z');

describe('assignment status transitions', () => {
  it('publishes and archives from draft', () => {
    expect(canTransitionStatus('draft', 'published')).toBe(true);
    expect(canTransitionStatus('draft', 'archived')).toBe(true);
  });

  it('cannot close a draft directly', () => {
    expect(canTransitionStatus('draft', 'closed')).toBe(false);
  });

  it('closes or archives a published assignment', () => {
    expect(canTransitionStatus('published', 'closed')).toBe(true);
    expect(canTransitionStatus('published', 'archived')).toBe(true);
    expect(canTransitionStatus('published', 'draft')).toBe(false);
  });

  it('reopens a closed assignment', () => {
    expect(canTransitionStatus('closed', 'published')).toBe(true);
  });

  it('restores an archived assignment to draft only', () => {
    expect(canTransitionStatus('archived', 'draft')).toBe(true);
    expect(canTransitionStatus('archived', 'published')).toBe(false);
  });

  it('treats a no-op transition as invalid', () => {
    expect(canTransitionStatus('published', 'published')).toBe(false);
  });
});

describe('submission window', () => {
  const base = {
    status: 'published' as const,
    dueDate: TOMORROW,
    closeDate: null,
    allowLateSubmission: true,
    now: NOW,
  };

  it('allows an on-time submission', () => {
    const result = evaluateSubmissionWindow(base);
    expect(result.allowed).toBe(true);
    expect(result.late).toBe(false);
  });

  it('blocks submissions on unpublished assignments', () => {
    const result = evaluateSubmissionWindow({ ...base, status: 'draft' });
    expect(result.allowed).toBe(false);
  });

  it('marks a past-due submission late when late work is allowed', () => {
    const result = evaluateSubmissionWindow({ ...base, dueDate: YESTERDAY });
    expect(result.allowed).toBe(true);
    expect(result.late).toBe(true);
  });

  it('blocks a past-due submission when late work is disallowed', () => {
    const result = evaluateSubmissionWindow({
      ...base,
      dueDate: YESTERDAY,
      allowLateSubmission: false,
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/late/i);
  });

  it('closeDate overrides the late-submission allowance', () => {
    const result = evaluateSubmissionWindow({
      ...base,
      dueDate: YESTERDAY,
      closeDate: YESTERDAY,
      allowLateSubmission: true,
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/closed/i);
  });

  it('treats a missing dueDate as never late', () => {
    const result = evaluateSubmissionWindow({ ...base, dueDate: null });
    expect(result.late).toBe(false);
    expect(isPastDue(null, NOW)).toBe(false);
  });

  it('maps lateness onto the submission status', () => {
    expect(resolveSubmissionStatus(true)).toBe('late');
    expect(resolveSubmissionStatus(false)).toBe('submitted');
  });
});

describe('attempt limits', () => {
  it('allows a first attempt', () => {
    const result = evaluateAttempt({
      previousAttempts: 0,
      maxAttempts: 1,
      allowResubmission: false,
    });
    expect(result.allowed).toBe(true);
    expect(result.nextAttempt).toBe(1);
  });

  it('blocks a second attempt when resubmission is off', () => {
    const result = evaluateAttempt({
      previousAttempts: 1,
      maxAttempts: 3,
      allowResubmission: false,
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/resubmission/i);
  });

  it('allows a resubmission within maxAttempts', () => {
    const result = evaluateAttempt({
      previousAttempts: 1,
      maxAttempts: 3,
      allowResubmission: true,
    });
    expect(result.allowed).toBe(true);
    expect(result.nextAttempt).toBe(2);
  });

  it('blocks once maxAttempts is exhausted', () => {
    const result = evaluateAttempt({
      previousAttempts: 3,
      maxAttempts: 3,
      allowResubmission: true,
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/Maximum attempts/);
  });
});

describe('grading', () => {
  const base = {
    totalMarks: 100,
    passingMarks: 40,
    late: false,
    latePenaltyPercent: 0,
  };

  it('grades by marks', () => {
    const outcome = resolveGradeOutcome({
      ...base,
      gradingMethod: 'marks',
      marksObtained: 75,
    });
    expect(outcome.marksObtained).toBe(75);
    expect(outcome.percentage).toBe(75);
    expect(outcome.passed).toBe(true);
  });

  it('fails below the passing mark', () => {
    const outcome = resolveGradeOutcome({
      ...base,
      gradingMethod: 'marks',
      marksObtained: 30,
    });
    expect(outcome.passed).toBe(false);
  });

  it('sums rubric criterion points', () => {
    const outcome = resolveGradeOutcome({
      ...base,
      gradingMethod: 'rubric',
      rubricScores: [{ points: 20 }, { points: 25 }, { points: 15 }],
    });
    expect(outcome.marksObtained).toBe(60);
    expect(outcome.percentage).toBe(60);
  });

  it('converts a percentage grade to marks', () => {
    const outcome = resolveGradeOutcome({
      ...base,
      gradingMethod: 'percentage',
      percentage: 80,
    });
    expect(outcome.marksObtained).toBe(80);
    expect(outcome.percentage).toBe(80);
  });

  it('maps pass_fail onto full or zero marks', () => {
    expect(
      resolveGradeOutcome({ ...base, gradingMethod: 'pass_fail', passed: true }).marksObtained,
    ).toBe(100);
    expect(
      resolveGradeOutcome({ ...base, gradingMethod: 'pass_fail', passed: false }).marksObtained,
    ).toBe(0);
  });

  it('applies the late penalty to the awarded marks', () => {
    const outcome = resolveGradeOutcome({
      ...base,
      gradingMethod: 'marks',
      marksObtained: 80,
      late: true,
      latePenaltyPercent: 25,
    });
    expect(outcome.marksObtained).toBe(60);
    expect(outcome.percentage).toBe(60);
  });

  it('caps marks at totalMarks', () => {
    const outcome = resolveGradeOutcome({
      ...base,
      gradingMethod: 'marks',
      marksObtained: 150,
    });
    expect(outcome.marksObtained).toBe(100);
    expect(outcome.percentage).toBe(100);
  });

  it('returns nulls when no grade value was supplied', () => {
    const outcome = resolveGradeOutcome({ ...base, gradingMethod: 'manual' });
    expect(outcome.marksObtained).toBeNull();
    expect(outcome.percentage).toBeNull();
  });

  it('computes penalties, percentages and pass checks directly', () => {
    expect(applyLatePenalty(100, 10)).toBe(90);
    expect(applyLatePenalty(100, 0)).toBe(100);
    expect(computePercentage(25, 50)).toBe(50);
    expect(computePercentage(10, 0)).toBe(0);
    expect(isPassing(40, 40)).toBe(true);
    expect(isPassing(39, 40)).toBe(false);
  });
});

describe('assignment helpers', () => {
  it('totals rubric max points', () => {
    expect(rubricTotalPoints([{ maxPoints: 10 }, { maxPoints: 15 }])).toBe(25);
    expect(rubricTotalPoints([])).toBe(0);
  });

  it('computes submission rate and handles zero expected', () => {
    expect(computeSubmissionRate(50, 100)).toBe(50);
    expect(computeSubmissionRate(5, 0)).toBe(0);
    expect(computeSubmissionRate(150, 100)).toBe(100);
  });

  it('builds pagination metadata', () => {
    expect(pageMeta(45, 2, 20)).toEqual({
      page: 2,
      limit: 20,
      total: 45,
      totalPages: 3,
      hasNextPage: true,
      hasPrevPage: true,
    });
    expect(pageMeta(0, 1, 20).totalPages).toBe(1);
  });

  it('parses dates leniently', () => {
    expect(parseDate(null)).toBeNull();
    expect(parseDate('not-a-date')).toBeNull();
    expect(parseDate('2026-08-07T12:00:00.000Z')?.toISOString()).toBe(
      '2026-08-07T12:00:00.000Z',
    );
  });

  it('maps content types to file extensions', () => {
    expect(extensionFor('application/pdf')).toBe('pdf');
    expect(extensionFor('image/png')).toBe('png');
    expect(extensionFor('application/unknown')).toBe('bin');
  });

  it('escapes CSV values containing separators', () => {
    const csv = rowsToCsv([{ title: 'Essay, part 1', id: 'a1' }], ['id', 'title']);
    expect(csv).toBe('id,title\na1,"Essay, part 1"\n');
  });
});
