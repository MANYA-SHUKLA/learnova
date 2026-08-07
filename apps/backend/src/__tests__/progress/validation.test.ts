import { describe, expect, it } from 'vitest';
import {
  openLessonSchema,
  completeLessonSchema,
  updateLessonProgressSchema,
  createBookmarkSchema,
  createNoteSchema,
  learningStatusSchema,
} from '@learnova/validation';

const oid = '507f1f77bcf86cd799439011';

describe('progress validation', () => {
  it('accepts learning status values', () => {
    for (const status of ['not_started', 'in_progress', 'completed', 'paused']) {
      expect(learningStatusSchema.parse(status)).toBe(status);
    }
  });

  it('validates open lesson input', () => {
    const parsed = openLessonSchema.parse({
      courseId: oid,
      moduleId: oid,
      lessonId: oid,
      position: 12,
    });
    expect(parsed.lessonId).toBe(oid);
  });

  it('validates complete lesson input', () => {
    const parsed = completeLessonSchema.parse({
      courseId: oid,
      moduleId: oid,
      lessonId: oid,
      watchPercentage: 100,
    });
    expect(parsed.watchPercentage).toBe(100);
  });

  it('rejects watchPercentage above 100', () => {
    const result = updateLessonProgressSchema.safeParse({
      courseId: oid,
      moduleId: oid,
      lessonId: oid,
      watchPercentage: 150,
    });
    expect(result.success).toBe(false);
  });

  it('requires moduleId for module bookmarks', () => {
    const result = createBookmarkSchema.safeParse({
      courseId: oid,
      targetType: 'module',
    });
    expect(result.success).toBe(false);
  });

  it('validates note creation', () => {
    const parsed = createNoteSchema.parse({
      courseId: oid,
      lessonId: oid,
      text: 'Important concept',
    });
    expect(parsed.text).toBe('Important concept');
  });
});
