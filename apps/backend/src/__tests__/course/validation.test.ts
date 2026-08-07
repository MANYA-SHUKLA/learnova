import { describe, expect, it } from 'vitest';
import {
  createCourseSchema,
  courseBulkIdsSchema,
  courseListQuerySchema,
  updateCourseSchema,
  courseBulkStatusSchema,
  courseBulkAssignFacultySchema,
} from '@learnova/validation';

const OID = '507f1f77bcf86cd799439011';

describe('course validation', () => {
  it('accepts a valid create payload', () => {
    const result = createCourseSchema.safeParse({
      courseCode: 'CS101',
      slug: 'intro-programming',
      title: 'Introduction to Programming',
      subtitle: 'Learn the basics',
      description: 'A comprehensive course on programming fundamentals',
      category: 'programming',
      difficulty: 'beginner',
      language: 'en',
      credits: 4,
      estimatedHours: 40,
      status: 'draft',
      visibility: 'institution',
      departmentId: OID,
    });
    expect(result.success).toBe(true);
  });

  it('requires valid course code and slug', () => {
    const result = createCourseSchema.safeParse({
      courseCode: 'CS-101',
      slug: 'intro programming', // Invalid slug (has space)
      title: 'Test',
    });
    expect(result.success).toBe(false);
  });

  it('validates list filters', () => {
    expect(
      courseListQuerySchema.safeParse({
        status: 'published',
        category: 'ai',
        difficulty: 'advanced',
        creditsMin: 3,
        creditsMax: 6,
        page: 1,
        limit: 20,
      }).success,
    ).toBe(true);
  });

  it('validates bulk operations', () => {
    expect(courseBulkIdsSchema.safeParse({ ids: [OID, OID] }).success).toBe(true);
    expect(
      courseBulkStatusSchema.safeParse({ ids: [OID], status: 'published' }).success,
    ).toBe(true);
    expect(
      courseBulkAssignFacultySchema.safeParse({
        ids: [OID],
        facultyIds: [OID],
        mode: 'append',
        coordinatorId: OID,
      }).success,
    ).toBe(true);
  });

  it('validates update schema partial fields', () => {
    expect(
      updateCourseSchema.safeParse({
        title: 'Updated Title',
        credits: 5,
      }).success,
    ).toBe(true);

    expect(
      updateCourseSchema.safeParse({
        status: 'published',
        visibility: 'public',
      }).success,
    ).toBe(true);
  });
});
