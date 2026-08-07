import { describe, expect, it } from 'vitest';
import {
  assignProjectGradeSchema,
  finalizeCourseGradesSchema,
  gradebookListQuerySchema,
  ingestGradebookSourceSchema,
  syncCourseGradebookSchema,
  upsertWeightSchemeSchema,
} from '@learnova/validation';

const validId = '507f1f77bcf86cd799439011';

describe('gradebook validation', () => {
  it('parses list query defaults', () => {
    const parsed = gradebookListQuerySchema.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(20);
  });

  it('accepts ingest source payload', () => {
    const parsed = ingestGradebookSourceSchema.parse({
      activityKind: 'assignment',
      sourceRefId: validId,
    });
    expect(parsed.activityKind).toBe('assignment');
  });

  it('accepts sync course payload', () => {
    const parsed = syncCourseGradebookSchema.parse({ courseId: validId });
    expect(parsed.courseId).toBe(validId);
  });

  it('accepts project grade payload', () => {
    const parsed = assignProjectGradeSchema.parse({
      submissionId: validId,
      marksObtained: 85,
    });
    expect(parsed.marksObtained).toBe(85);
  });

  it('requires weights to be numeric in upsert scheme', () => {
    const parsed = upsertWeightSchemeSchema.parse({ courseId: validId });
    expect(parsed.assignmentWeight + parsed.projectWeight).toBeGreaterThan(0);
  });

  it('accepts finalize payload', () => {
    const parsed = finalizeCourseGradesSchema.parse({ courseId: validId });
    expect(parsed.courseId).toBe(validId);
  });
});
