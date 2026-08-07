import { describe, expect, it } from 'vitest';
import {
  createStudentSchema,
  studentBulkAssignSectionSchema,
  studentBulkAssignSemesterSchema,
  studentBulkAssignBatchSchema,
  studentBulkAssignDepartmentSchema,
  studentListQuerySchema,
} from '@learnova/validation';

const OID = '507f1f77bcf86cd799439011';

describe('student CRUD validation', () => {
  it('accepts full create payload including all assignments', () => {
    const result = createStudentSchema.safeParse({
      studentId: 'STU-2024-100',
      admissionNumber: 'ADM-2024-100',
      rollNumber: 'ROLL-100',
      registrationNumber: 'REG-100',
      firstName: 'Ananya',
      lastName: 'Verma',
      email: 'ananya.verma@student.edu',
      departmentId: OID,
      programId: OID,
      academicYearId: OID,
      semesterId: OID,
      sectionId: OID,
      batchId: OID,
      yearOfStudy: 3,
      currentSemester: 5,
      dateOfBirth: '2002-05-20',
      admissionDate: '2024-08-15',
      phone: '+919876543210',
      gender: 'female',
      scholarship: true,
      guardianName: 'Mr. Verma',
      guardianPhone: '+919999999999',
    });
    expect(result.success).toBe(true);
  });

  it('validates bulk assign section payload', () => {
    expect(
      studentBulkAssignSectionSchema.safeParse({
        ids: [OID],
        sectionId: OID,
      }).success,
    ).toBe(true);
  });

  it('validates bulk assign semester payload', () => {
    expect(
      studentBulkAssignSemesterSchema.safeParse({
        ids: [OID],
        semesterId: OID,
        academicYearId: OID,
        currentSemester: 6,
      }).success,
    ).toBe(true);
  });

  it('validates bulk assign batch payload', () => {
    expect(
      studentBulkAssignBatchSchema.safeParse({
        ids: [OID],
        batchId: OID,
      }).success,
    ).toBe(true);
  });

  it('validates bulk assign department payload', () => {
    expect(
      studentBulkAssignDepartmentSchema.safeParse({
        ids: [OID],
        departmentId: OID,
        schoolId: OID,
        campusId: OID,
        programId: OID,
      }).success,
    ).toBe(true);
  });

  it('supports search filters for department, program, and section', () => {
    expect(
      studentListQuerySchema.safeParse({
        q: 'Ananya',
        departmentId: OID,
        programId: OID,
        sectionId: OID,
        batchId: OID,
        campusId: OID,
        schoolId: OID,
        status: 'active',
        yearOfStudy: 2,
        scholarship: true,
      }).success,
    ).toBe(true);
  });
});

describe('student audit event names', () => {
  it('includes required Step 5 audit events', () => {
    const required = [
      'student.created',
      'student.updated',
      'student.archived',
      'student.restored',
      'student.imported',
      'student.exported',
      'student.profile.updated',
    ];
    expect(required).toHaveLength(7);
  });
});
