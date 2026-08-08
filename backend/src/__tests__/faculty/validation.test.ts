import { describe, expect, it } from 'vitest';
import {
  createFacultySchema,
  facultyBulkIdsSchema,
  facultyListQuerySchema,
  updateFacultyProfileSchema,
} from '@learnova/validation';

const OID = '507f1f77bcf86cd799439011';

describe('faculty validation', () => {
  it('accepts a valid create payload', () => {
    const result = createFacultySchema.safeParse({
      employeeId: 'EMP-1001',
      facultyCode: 'FAC1001',
      firstName: 'Ramesh',
      lastName: 'Rai',
      email: 'ramesh.rai@campus.edu',
      designation: 'assistant_professor',
      employmentType: 'full_time',
      departmentId: OID,
    });
    expect(result.success).toBe(true);
  });

  it('requires custom designation when designation is custom', () => {
    const result = createFacultySchema.safeParse({
      employeeId: 'EMP-1002',
      facultyCode: 'FAC1002',
      firstName: 'Asha',
      lastName: 'Mehta',
      email: 'asha@campus.edu',
      designation: 'custom',
      employmentType: 'adjunct',
    });
    expect(result.success).toBe(false);
  });

  it('validates list filters', () => {
    expect(
      facultyListQuerySchema.safeParse({
        status: 'on_leave',
        employmentType: 'guest_faculty',
        experienceMin: 2,
        page: 1,
        limit: 20,
      }).success,
    ).toBe(true);
  });

  it('validates bulk ids and profile update', () => {
    expect(facultyBulkIdsSchema.safeParse({ ids: [OID] }).success).toBe(true);
    expect(
      updateFacultyProfileSchema.safeParse({
        officeHours: 'Mon–Fri 10:00–12:00',
        phone: '+919999999999',
      }).success,
    ).toBe(true);
  });
});
