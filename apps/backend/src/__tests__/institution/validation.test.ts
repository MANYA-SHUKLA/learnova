import { describe, expect, it } from 'vitest';
import {
  createCampusSchema,
  createDepartmentSchema,
  createInstitutionSchema,
  createProgramSchema,
  createSectionSchema,
  createSemesterSchema,
  orgListQuerySchema,
  updateInstitutionBrandingSchema,
  updateInstitutionSettingsSchema,
} from '@learnova/validation';

describe('institution validation schemas', () => {
  it('accepts a valid institution create payload', () => {
    const result = createInstitutionSchema.safeParse({
      name: 'Learnova Institute of Technology',
      shortName: 'LIT',
      slug: 'learnova-institute',
      code: 'LIT01',
      email: 'admin@lit.edu',
      country: 'India',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid institution slug and email', () => {
    expect(
      createInstitutionSchema.safeParse({
        name: 'X',
        shortName: 'X',
        slug: 'BAD SLUG',
        code: 'X',
        email: 'not-an-email',
        country: 'IN',
      }).success,
    ).toBe(false);
  });

  it('validates campus, department, and program payloads', () => {
    expect(
      createCampusSchema.safeParse({ name: 'Main Campus', code: 'MAIN' }).success,
    ).toBe(true);
    expect(
      createDepartmentSchema.safeParse({
        schoolId: '507f1f77bcf86cd799439011',
        name: 'Computer Science',
        code: 'CSE',
      }).success,
    ).toBe(true);
    expect(
      createProgramSchema.safeParse({
        departmentId: '507f1f77bcf86cd799439011',
        name: 'B.Tech',
        code: 'BT',
        durationYears: 4,
        credits: 160,
        level: 'undergraduate',
      }).success,
    ).toBe(true);
  });

  it('validates semester term and section capacity', () => {
    expect(
      createSemesterSchema.safeParse({
        academicYearId: '507f1f77bcf86cd799439011',
        name: 'Semester 1',
        number: 1,
        term: 'odd',
      }).success,
    ).toBe(true);
    expect(
      createSemesterSchema.safeParse({
        academicYearId: '507f1f77bcf86cd799439011',
        name: 'Summer',
        number: 3,
        term: 'winter',
      }).success,
    ).toBe(false);
    expect(
      createSectionSchema.safeParse({
        programId: '507f1f77bcf86cd799439011',
        semesterId: '507f1f77bcf86cd799439012',
        name: 'A',
        capacity: 60,
      }).success,
    ).toBe(true);
  });

  it('validates list query coercion and branding/settings', () => {
    const list = orgListQuerySchema.safeParse({ page: '2', limit: '10', q: 'cse' });
    expect(list.success).toBe(true);
    if (list.success) {
      expect(list.data.page).toBe(2);
      expect(list.data.limit).toBe(10);
    }
    expect(
      updateInstitutionBrandingSchema.safeParse({
        logo: 'https://cdn.example.com/logo.png',
        favicon: null,
      }).success,
    ).toBe(true);
    expect(
      updateInstitutionSettingsSchema.safeParse({
        language: 'en',
        theme: 'dark',
        attendance: { minPercent: 75 },
      }).success,
    ).toBe(true);
  });
});
