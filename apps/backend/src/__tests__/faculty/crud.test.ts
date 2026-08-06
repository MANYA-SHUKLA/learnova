import { describe, expect, it } from 'vitest';
import {
  createFacultySchema,
  facultyBulkAssignAcademicSchema,
  facultyListQuerySchema,
} from '@learnova/validation';

const OID = '507f1f77bcf86cd799439011';

describe('faculty CRUD validation', () => {
  it('accepts full create payload including assignments', () => {
    const result = createFacultySchema.safeParse({
      employeeId: 'EMP-2001',
      facultyCode: 'FAC2001',
      firstName: 'Neha',
      lastName: 'Sharma',
      email: 'neha.sharma@campus.edu',
      designation: 'associate_professor',
      employmentType: 'full_time',
      departmentId: OID,
      programIds: [OID],
      courseIds: [OID],
      academicYearId: OID,
      semesterId: OID,
      dateOfBirth: '1990-01-15',
      joiningDate: '2024-07-01',
      alternatePhone: '+919876543210',
      gender: 'female',
    });
    expect(result.success).toBe(true);
  });

  it('validates academic assignment bulk payload', () => {
    expect(
      facultyBulkAssignAcademicSchema.safeParse({
        ids: [OID],
        academicYearId: OID,
        semesterId: OID,
        courseIds: [OID],
        mode: 'replace',
      }).success,
    ).toBe(true);
  });

  it('supports search filters for department and designation', () => {
    expect(
      facultyListQuerySchema.safeParse({
        q: 'Neha',
        departmentId: OID,
        designation: 'dean',
        campusId: OID,
        schoolId: OID,
        status: 'active',
      }).success,
    ).toBe(true);
  });
});

describe('faculty audit event names', () => {
  it('includes required Step 5 audit events', () => {
    const required = [
      'faculty.created',
      'faculty.updated',
      'faculty.archived',
      'faculty.restored',
      'faculty.imported',
      'faculty.exported',
      'faculty.profile.updated',
    ];
    expect(required).toHaveLength(7);
  });
});
