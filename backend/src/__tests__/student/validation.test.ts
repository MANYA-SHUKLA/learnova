import { describe, expect, it } from 'vitest';
import {
  createStudentSchema,
  studentBulkIdsSchema,
  studentListQuerySchema,
  updateStudentProfileSchema,
} from '@learnova/validation';

const OID = '507f1f77bcf86cd799439011';

describe('student validation', () => {
  it('accepts a valid create payload', () => {
    const result = createStudentSchema.safeParse({
      studentId: 'STU-2024-001',
      admissionNumber: 'ADM-2024-001',
      firstName: 'Priya',
      lastName: 'Sharma',
      email: 'priya.sharma@student.edu',
      departmentId: OID,
      status: 'active',
    });
    expect(result.success).toBe(true);
  });

  it('requires studentId and admissionNumber', () => {
    const result = createStudentSchema.safeParse({
      firstName: 'Raj',
      lastName: 'Kumar',
      email: 'raj@student.edu',
    });
    expect(result.success).toBe(false);
  });

  it('validates list filters', () => {
    expect(
      studentListQuerySchema.safeParse({
        status: 'active',
        departmentId: OID,
        programId: OID,
        yearOfStudy: 2,
        scholarship: true,
        page: 1,
        limit: 20,
      }).success,
    ).toBe(true);
  });

  it('validates bulk ids and profile update', () => {
    expect(studentBulkIdsSchema.safeParse({ ids: [OID] }).success).toBe(true);
    expect(
      updateStudentProfileSchema.safeParse({
        phone: '+919876543210',
        bio: 'Computer Science student',
        linkedin: 'https://linkedin.com/in/student',
      }).success,
    ).toBe(true);
  });
});
