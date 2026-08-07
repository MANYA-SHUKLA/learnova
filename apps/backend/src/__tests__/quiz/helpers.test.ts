import { describe, expect, it } from 'vitest';
import {
  ACTIVE_ENROLLMENT_STATUSES,
  QUIZ_CSV_HEADERS,
  canTransitionStatus,
  computePercentage,
  generateSlug,
  isClosed,
  isPassing,
  pageMeta,
  parseDate,
  rowsToCsv,
} from '../../services/quiz/quiz.helpers.js';

const NOW = new Date('2026-08-07T12:00:00.000Z');
const YESTERDAY = new Date('2026-08-06T12:00:00.000Z');
const TOMORROW = new Date('2026-08-08T12:00:00.000Z');

describe('quiz status transitions', () => {
  it('publishes and archives from draft', () => {
    expect(canTransitionStatus('draft', 'published')).toBe(true);
    expect(canTransitionStatus('draft', 'archived')).toBe(true);
  });

  it('cannot close a draft directly', () => {
    expect(canTransitionStatus('draft', 'closed')).toBe(false);
  });

  it('closes or archives a published quiz', () => {
    expect(canTransitionStatus('published', 'closed')).toBe(true);
    expect(canTransitionStatus('published', 'archived')).toBe(true);
    expect(canTransitionStatus('published', 'draft')).toBe(false);
  });

  it('reopens a closed quiz', () => {
    expect(canTransitionStatus('closed', 'published')).toBe(true);
  });

  it('restores an archived quiz to draft only', () => {
    expect(canTransitionStatus('archived', 'draft')).toBe(true);
    expect(canTransitionStatus('archived', 'published')).toBe(false);
  });
});

describe('quiz helpers', () => {
  it('generates URL-safe slugs', () => {
    expect(generateSlug('Weekly Quiz #1')).toBe('weekly-quiz-1');
  });

  it('computes pagination metadata', () => {
    const meta = pageMeta(45, 2, 20);
    expect(meta.totalPages).toBe(3);
    expect(meta.hasNextPage).toBe(true);
    expect(meta.hasPrevPage).toBe(true);
  });

  it('parses ISO dates', () => {
    expect(parseDate('2026-08-07T10:00:00.000Z')?.toISOString()).toBe(
      '2026-08-07T10:00:00.000Z',
    );
    expect(parseDate('invalid')).toBeNull();
  });

  it('detects closed quizzes by close date', () => {
    expect(isClosed(YESTERDAY, NOW)).toBe(true);
    expect(isClosed(TOMORROW, NOW)).toBe(false);
  });

  it('computes percentage and pass/fail', () => {
    expect(computePercentage(75, 100)).toBe(75);
    expect(isPassing(75, 40)).toBe(true);
    expect(isPassing(30, 40)).toBe(false);
  });

  it('exports CSV rows with headers', () => {
    const csv = rowsToCsv([{ id: '1', title: 'Quiz, A' }], QUIZ_CSV_HEADERS);
    expect(csv.startsWith(QUIZ_CSV_HEADERS.join(','))).toBe(true);
    expect(csv).toContain('"Quiz, A"');
  });

  it('re-exports enrollment status constants', () => {
    expect(ACTIVE_ENROLLMENT_STATUSES).toContain('active');
    expect(ACTIVE_ENROLLMENT_STATUSES).toContain('approved');
    expect(ACTIVE_ENROLLMENT_STATUSES).toContain('completed');
  });
});
