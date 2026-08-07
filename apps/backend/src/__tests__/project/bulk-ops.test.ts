import { describe, expect, it } from 'vitest';
import { bulkAssignFacultySchema, bulkProjectIdsSchema } from '@learnova/validation';

const OBJECT_ID = '507f1f77bcf86cd799439011';

describe('project bulk operations validation', () => {
  it('requires at least one project id', () => {
    expect(bulkProjectIdsSchema.safeParse({ projectIds: [] }).success).toBe(false);
    expect(bulkProjectIdsSchema.safeParse({ projectIds: [OBJECT_ID] }).success).toBe(true);
  });

  it('caps bulk ids at 100', () => {
    const projectIds = Array.from({ length: 101 }, () => OBJECT_ID);
    expect(bulkProjectIdsSchema.safeParse({ projectIds }).success).toBe(false);
  });

  it('validates bulk assign faculty payload', () => {
    const parsed = bulkAssignFacultySchema.parse({
      projectIds: [OBJECT_ID],
      facultyIds: [OBJECT_ID],
    });
    expect(parsed.facultyIds).toHaveLength(1);
  });

  it('rejects assign faculty without faculty ids', () => {
    expect(
      bulkAssignFacultySchema.safeParse({ projectIds: [OBJECT_ID], facultyIds: [] }).success,
    ).toBe(false);
  });
});
