import { describe, expect, it } from 'vitest';
import {
  ACTIVE_ENROLLMENT_STATUSES,
  EXAM_STATUS_TRANSITIONS,
  canTransitionExamStatus,
  generateSlug,
  isExamActive,
  isExamPublished,
  pageMeta,
  parseDate,
  toExamScheduleDto,
} from '../../services/examination/examination.helpers.js';

describe('exam status transitions', () => {
  it('schedules and publishes from draft', () => {
    expect(canTransitionExamStatus('draft', 'scheduled')).toBe(true);
    expect(canTransitionExamStatus('draft', 'published')).toBe(true);
    expect(canTransitionExamStatus('draft', 'archived')).toBe(true);
  });

  it('cannot complete a draft directly', () => {
    expect(canTransitionExamStatus('draft', 'completed')).toBe(false);
  });

  it('starts in_progress from published', () => {
    expect(canTransitionExamStatus('published', 'in_progress')).toBe(true);
    expect(canTransitionExamStatus('published', 'cancelled')).toBe(true);
  });

  it('completes or cancels an in_progress exam', () => {
    expect(canTransitionExamStatus('in_progress', 'completed')).toBe(true);
    expect(canTransitionExamStatus('in_progress', 'cancelled')).toBe(true);
  });

  it('restores an archived exam to draft only', () => {
    expect(canTransitionExamStatus('archived', 'draft')).toBe(true);
    expect(canTransitionExamStatus('archived', 'published')).toBe(false);
  });

  it('defines transitions for every status', () => {
    const statuses = Object.keys(EXAM_STATUS_TRANSITIONS);
    expect(statuses).toContain('draft');
    expect(statuses).toContain('cancelled');
  });
});

describe('examination helpers', () => {
  it('generates URL-safe slugs', () => {
    expect(generateSlug('Final Exam #1')).toBe('final-exam-1');
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

  it('serializes exam schedule to ISO strings', () => {
    const dto = toExamScheduleDto({
      registrationOpensAt: null,
      registrationClosesAt: null,
      checkInOpensAt: null,
      startsAt: new Date('2026-09-01T09:00:00.000Z'),
      endsAt: new Date('2026-09-01T12:00:00.000Z'),
      lateEntryMinutes: 15,
      gracePeriodMinutes: 5,
    });
    expect(dto.startsAt).toBe('2026-09-01T09:00:00.000Z');
    expect(dto.lateEntryMinutes).toBe(15);
  });

  it('detects published and active exam statuses', () => {
    expect(isExamPublished('published')).toBe(true);
    expect(isExamPublished('in_progress')).toBe(true);
    expect(isExamPublished('draft')).toBe(false);
    expect(isExamActive('in_progress')).toBe(true);
    expect(isExamActive('published')).toBe(false);
  });

  it('re-exports enrollment status constants', () => {
    expect(ACTIVE_ENROLLMENT_STATUSES).toContain('active');
    expect(ACTIVE_ENROLLMENT_STATUSES).toContain('approved');
  });
});
