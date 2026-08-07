import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { REGEX } from '@learnova/constants';

const objectIdField = z.string().regex(REGEX.OBJECT_ID, 'Invalid ObjectId');

const projectBulkIdsSchema = z.object({
  ids: z.array(objectIdField).min(1).max(100),
});

const projectBulkAssignFacultySchema = z.object({
  ids: z.array(objectIdField).min(1).max(100),
  facultyIds: z.array(objectIdField).min(1).max(50),
});

const OBJECT_ID = '507f1f77bcf86cd799439011';

describe('project bulk operations validation', () => {
  it('requires at least one project id', () => {
    expect(projectBulkIdsSchema.safeParse({ ids: [] }).success).toBe(false);
    expect(projectBulkIdsSchema.safeParse({ ids: [OBJECT_ID] }).success).toBe(true);
  });

  it('caps bulk ids at 100', () => {
    const ids = Array.from({ length: 101 }, () => OBJECT_ID);
    expect(projectBulkIdsSchema.safeParse({ ids }).success).toBe(false);
  });

  it('validates bulk assign faculty payload', () => {
    const parsed = projectBulkAssignFacultySchema.parse({
      ids: [OBJECT_ID],
      facultyIds: [OBJECT_ID],
    });
    expect(parsed.facultyIds).toHaveLength(1);
  });

  it('rejects assign faculty without faculty ids', () => {
    expect(
      projectBulkAssignFacultySchema.safeParse({ ids: [OBJECT_ID], facultyIds: [] }).success,
    ).toBe(false);
  });
});
