import { describe, expect, it } from 'vitest';
import {
  canTransitionStatus,
  computePercentage,
  computeSubmissionRate,
  evaluateAttempt,
  evaluateSubmissionWindow,
  extensionFor,
  isPassing,
  pageMeta,
  parseDate,
  resolveGradeOutcome,
  resolveSubmissionStatus,
  rowsToCsv,
} from '../../services/project/project.helpers.js';

const NOW = new Date('2026-08-07T12:00:00.000Z');
const YESTERDAY = new Date('2026-08-06T12:00:00.000Z');
const TOMORROW = new Date('2026-08-08T12:00:00.000Z');

describe('project status transitions', () => {
  it('publishes and archives from draft', () => {
    expect(canTransitionStatus('draft', 'published')).toBe(true);
    expect(canTransitionStatus('draft', 'archived')).toBe(true);
  });

  it('cannot close a draft directly', () => {
    expect(canTransitionStatus('draft', 'closed')).toBe(false);
  });
});

describe('project submission window', () => {
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

  it('uses project-specific closed message', () => {
    const result = evaluateSubmissionWindow({
      ...base,
      status: 'draft',
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/project/i);
  });
});

describe('project grading helpers', () => {
  it('computes percentage and pass/fail', () => {
    expect(computePercentage(75, 100)).toBe(75);
    expect(isPassing(45, 40)).toBe(true);
  });

  it('resolves marks-based grade outcome with late penalty', () => {
    const outcome = resolveGradeOutcome({
      gradingMethod: 'marks',
      marksObtained: 80,
      totalMarks: 100,
      passingMarks: 40,
      late: true,
      latePenaltyPercent: 10,
    });
    expect(outcome.marksObtained).toBe(72);
    expect(outcome.passed).toBe(true);
  });

  it('resolves submission status from lateness', () => {
    expect(resolveSubmissionStatus(false)).toBe('submitted');
    expect(resolveSubmissionStatus(true)).toBe('late');
  });
});

describe('project utility helpers', () => {
  it('builds pagination meta', () => {
    expect(pageMeta(45, 2, 20)).toMatchObject({
      page: 2,
      totalPages: 3,
      hasNextPage: true,
      hasPrevPage: true,
    });
  });

  it('parses ISO dates', () => {
    expect(parseDate('2026-08-07T10:00:00.000Z')?.toISOString()).toBe(
      '2026-08-07T10:00:00.000Z',
    );
    expect(parseDate('invalid')).toBeNull();
  });

  it('computes submission rate safely', () => {
    expect(computeSubmissionRate(5, 10)).toBe(50);
    expect(computeSubmissionRate(0, 0)).toBe(0);
  });

  it('evaluates attempt limits', () => {
    expect(evaluateAttempt({ previousAttempts: 0, maxAttempts: 1, allowResubmission: false }).allowed).toBe(true);
    expect(evaluateAttempt({ previousAttempts: 1, maxAttempts: 1, allowResubmission: false }).allowed).toBe(false);
  });

  it('maps content types to extensions', () => {
    expect(extensionFor('application/pdf')).toBe('pdf');
  });

  it('exports CSV rows', () => {
    const csv = rowsToCsv([{ id: '1', title: 'A, B' }], ['id', 'title']);
    expect(csv).toContain('"A, B"');
  });
});
