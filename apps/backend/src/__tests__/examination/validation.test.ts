import { describe, expect, it } from 'vitest';
import {
  assignSeatingSchema,
  checkInExamSchema,
  createExamSchema,
  examBulkActionSchema,
  examListQuerySchema,
  proctorEventSchema,
  startExamAttemptSchema,
  submitExamAnswerSchema,
  submitExamSchema,
  updateExamSchema,
} from '@learnova/validation';

const OBJECT_ID = '507f1f77bcf86cd799439011';

const validSchedule = {
  startsAt: '2026-09-01T09:00:00.000Z',
  endsAt: '2026-09-01T12:00:00.000Z',
};

describe('examination validation', () => {
  it('applies defaults when creating an exam', () => {
    const parsed = createExamSchema.parse({
      courseId: OBJECT_ID,
      title: 'Midterm Examination',
      schedule: validSchedule,
    });

    expect(parsed.examType).toBe('internal');
    expect(parsed.visibility).toBe('enrolled');
    expect(parsed.rules.totalMarks).toBe(100);
    expect(parsed.rules.passingMarks).toBe(40);
    expect(parsed.rules.durationMinutes).toBe(120);
    expect(parsed.rules.attemptLimit).toBe(1);
    expect(parsed.proctoring.mode).toBe('none');
    expect(parsed.seatingEnabled).toBe(false);
  });

  it('rejects a non-ObjectId courseId', () => {
    const result = createExamSchema.safeParse({
      courseId: 'nope',
      title: 'X',
      schedule: validSchedule,
    });
    expect(result.success).toBe(false);
  });

  it('makes update partial and drops courseId', () => {
    const parsed = updateExamSchema.parse({ title: 'Renamed Exam' });
    expect(parsed.title).toBe('Renamed Exam');
    expect('courseId' in parsed).toBe(false);
  });

  it('validates exam list query defaults', () => {
    const parsed = examListQuerySchema.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(20);
    expect(parsed.sortBy).toBe('startsAt');
    expect(parsed.sortOrder).toBe('desc');
  });

  it('validates check-in input', () => {
    const parsed = checkInExamSchema.parse({ examId: OBJECT_ID });
    expect(parsed.examId).toBe(OBJECT_ID);
  });

  it('validates start attempt input', () => {
    const parsed = startExamAttemptSchema.parse({
      examId: OBJECT_ID,
      secureBrowserAcknowledged: true,
    });
    expect(parsed.secureBrowserAcknowledged).toBe(true);
  });

  it('validates submit answer input', () => {
    const parsed = submitExamAnswerSchema.parse({
      questionId: OBJECT_ID,
      selectedOptionIds: [OBJECT_ID],
    });
    expect(parsed.timeSpentSeconds).toBe(0);
  });

  it('validates submit exam input', () => {
    const parsed = submitExamSchema.parse({ attemptId: OBJECT_ID });
    expect(parsed.answers).toEqual([]);
  });

  it('validates bulk action schema', () => {
    const parsed = examBulkActionSchema.parse({
      ids: [OBJECT_ID],
      action: 'publish',
    });
    expect(parsed.action).toBe('publish');
  });

  it('validates seating assignment schema', () => {
    const parsed = assignSeatingSchema.parse({
      examId: OBJECT_ID,
      assignments: [{ studentId: OBJECT_ID, seatNumber: 'A-12' }],
    });
    expect(parsed.assignments).toHaveLength(1);
  });

  it('validates proctor event schema', () => {
    const parsed = proctorEventSchema.parse({
      attemptId: OBJECT_ID,
      eventType: 'tab_switch',
      severity: 'warning',
    });
    expect(parsed.eventType).toBe('tab_switch');
  });
});
