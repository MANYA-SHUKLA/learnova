import { z } from 'zod';
import { PAGINATION, REGEX } from '@learnova/constants';

const objectIdField = z.string().regex(REGEX.OBJECT_ID, 'Invalid ObjectId');
const emailField = z.string().email().toLowerCase().trim();
const optionalUrl = z.string().url().optional().nullable();
const optionalEmail = emailField.optional().nullable();
const optionalString = (max: number) => z.string().trim().max(max).optional().nullable();

export const studentStatusSchema = z.enum([
  'active',
  'inactive',
  'suspended',
  'graduated',
  'dropped',
  'transferred',
  'archived',
]);

export const studentGenderSchema = z.enum([
  'male',
  'female',
  'other',
  'prefer_not_to_say',
]);

export const studentListQuerySchema = z.object({
  q: z.string().trim().min(1).max(200).optional(),
  status: studentStatusSchema.optional(),
  includeDeleted: z.coerce.boolean().optional().default(false),
  campusId: objectIdField.optional(),
  schoolId: objectIdField.optional(),
  departmentId: objectIdField.optional(),
  programId: objectIdField.optional(),
  academicYearId: objectIdField.optional(),
  semesterId: objectIdField.optional(),
  sectionId: objectIdField.optional(),
  batchId: objectIdField.optional(),
  yearOfStudy: z.coerce.number().int().min(1).max(10).optional(),
  scholarship: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGINATION.MAX_LIMIT)
    .default(PAGINATION.DEFAULT_LIMIT),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const studentSearchQuerySchema = z.object({
  q: z.string().trim().min(1).max(200),
  page: z.coerce.number().int().min(1).default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGINATION.MAX_LIMIT)
    .default(PAGINATION.DEFAULT_LIMIT),
});

export const studentIdParamsSchema = z.object({
  id: objectIdField,
});

const studentBaseFields = {
  studentId: z.string().trim().min(1).max(64),
  admissionNumber: z.string().trim().min(1).max(64),
  rollNumber: optionalString(64),
  registrationNumber: optionalString(64),
  campusId: objectIdField.optional().nullable(),
  schoolId: objectIdField.optional().nullable(),
  departmentId: objectIdField.optional().nullable(),
  programId: objectIdField.optional().nullable(),
  academicYearId: objectIdField.optional().nullable(),
  semesterId: objectIdField.optional().nullable(),
  sectionId: objectIdField.optional().nullable(),
  batchId: objectIdField.optional().nullable(),
  firstName: z.string().trim().min(1).max(80),
  middleName: optionalString(80),
  lastName: z.string().trim().min(1).max(80),
  email: emailField,
  alternateEmail: optionalEmail,
  phone: optionalString(30),
  alternatePhone: optionalString(30),
  profilePhoto: optionalUrl,
  gender: studentGenderSchema.optional().nullable(),
  dateOfBirth: z.coerce.date().optional().nullable(),
  bloodGroup: optionalString(8),
  nationality: optionalString(80),
  religion: optionalString(80),
  category: optionalString(80),
  address: optionalString(500),
  city: optionalString(80),
  state: optionalString(80),
  country: optionalString(80),
  postalCode: optionalString(20),
  guardianName: optionalString(120),
  guardianRelation: optionalString(80),
  guardianPhone: optionalString(30),
  guardianEmail: optionalEmail,
  emergencyContactName: optionalString(120),
  emergencyContactPhone: optionalString(30),
  admissionDate: z.coerce.date().optional().nullable(),
  expectedGraduationDate: z.coerce.date().optional().nullable(),
  programDuration: z.coerce.number().int().min(1).max(12).optional().nullable(),
  yearOfStudy: z.coerce.number().int().min(1).max(10).optional().nullable(),
  currentSemester: z.coerce.number().int().min(1).max(20).optional().nullable(),
  scholarship: z.boolean().optional().default(false),
  hostelResident: z.boolean().optional().default(false),
  transportRequired: z.boolean().optional().default(false),
  bio: optionalString(4000),
  linkedin: optionalUrl,
  website: optionalUrl,
  isActive: z.boolean().optional().default(true),
  status: studentStatusSchema.optional().default('active'),
};

const studentObjectSchema = z.object(studentBaseFields);

export const createStudentSchema = studentObjectSchema;

export const updateStudentSchema = studentObjectSchema.partial();

export const updateStudentProfileSchema = z.object({
  phone: optionalString(30),
  alternatePhone: optionalString(30),
  alternateEmail: optionalEmail,
  profilePhoto: optionalUrl,
  bio: optionalString(4000),
  linkedin: optionalUrl,
  website: optionalUrl,
  address: optionalString(500),
  city: optionalString(80),
  state: optionalString(80),
  country: optionalString(80),
  postalCode: optionalString(20),
  emergencyContactName: optionalString(120),
  emergencyContactPhone: optionalString(30),
  guardianPhone: optionalString(30),
  guardianEmail: optionalEmail,
});

export const studentBulkIdsSchema = z.object({
  ids: z.array(objectIdField).min(1).max(500),
});

export const studentBulkStatusSchema = z.object({
  ids: z.array(objectIdField).min(1).max(500),
  status: studentStatusSchema,
});

export const studentBulkAssignSectionSchema = z.object({
  ids: z.array(objectIdField).min(1).max(500),
  sectionId: objectIdField,
});

export const studentBulkAssignSemesterSchema = z.object({
  ids: z.array(objectIdField).min(1).max(500),
  semesterId: objectIdField,
  academicYearId: objectIdField.optional().nullable(),
  currentSemester: z.coerce.number().int().min(1).max(20).optional().nullable(),
});

export const studentBulkAssignBatchSchema = z.object({
  ids: z.array(objectIdField).min(1).max(500),
  batchId: objectIdField,
});

export const studentBulkAssignDepartmentSchema = z.object({
  ids: z.array(objectIdField).min(1).max(500),
  departmentId: objectIdField,
  schoolId: objectIdField.optional().nullable(),
  campusId: objectIdField.optional().nullable(),
  programId: objectIdField.optional().nullable(),
});

export const studentImportConfirmSchema = z.object({
  rows: z.array(z.record(z.string(), z.string())).min(1).max(2000),
  dryRun: z.boolean().optional().default(false),
});

export const studentExportQuerySchema = z.object({
  format: z.enum(['csv', 'excel', 'pdf']).optional().default('csv'),
  q: z.string().trim().min(1).max(200).optional(),
  status: studentStatusSchema.optional(),
  campusId: objectIdField.optional(),
  schoolId: objectIdField.optional(),
  departmentId: objectIdField.optional(),
  programId: objectIdField.optional(),
  academicYearId: objectIdField.optional(),
  semesterId: objectIdField.optional(),
  sectionId: objectIdField.optional(),
  batchId: objectIdField.optional(),
  yearOfStudy: z.coerce.number().int().min(1).max(10).optional(),
  scholarship: z.coerce.boolean().optional(),
  includeDeleted: z.coerce.boolean().optional().default(false),
});

export const studentPhotoUploadSchema = z.object({
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  /** Base64 payload without data-URL prefix */
  data: z.string().min(32).max(5_000_000),
});

export type StudentListQuery = z.infer<typeof studentListQuerySchema>;
export type StudentSearchQuery = z.infer<typeof studentSearchQuerySchema>;
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type UpdateStudentProfileInput = z.infer<typeof updateStudentProfileSchema>;
export type StudentBulkIdsInput = z.infer<typeof studentBulkIdsSchema>;
export type StudentBulkStatusInput = z.infer<typeof studentBulkStatusSchema>;
export type StudentBulkAssignSectionInput = z.infer<typeof studentBulkAssignSectionSchema>;
export type StudentBulkAssignSemesterInput = z.infer<typeof studentBulkAssignSemesterSchema>;
export type StudentBulkAssignBatchInput = z.infer<typeof studentBulkAssignBatchSchema>;
export type StudentBulkAssignDepartmentInput = z.infer<typeof studentBulkAssignDepartmentSchema>;
export type StudentImportConfirmInput = z.infer<typeof studentImportConfirmSchema>;
export type StudentExportQuery = z.infer<typeof studentExportQuerySchema>;
export type StudentPhotoUploadInput = z.infer<typeof studentPhotoUploadSchema>;
