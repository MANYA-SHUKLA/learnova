import { z } from 'zod';
import { PAGINATION, REGEX } from '@learnova/constants';

const objectIdField = z.string().regex(REGEX.OBJECT_ID, 'Invalid ObjectId');
const emailField = z.string().email().toLowerCase().trim();
const optionalUrl = z.string().url().optional().nullable();
const optionalEmail = emailField.optional().nullable();
const optionalString = (max: number) => z.string().trim().max(max).optional().nullable();

export const facultyStatusSchema = z.enum([
  'active',
  'on_leave',
  'suspended',
  'retired',
  'archived',
]);

export const facultyEmploymentTypeSchema = z.enum([
  'full_time',
  'part_time',
  'adjunct',
  'guest_faculty',
  'visiting_professor',
  'research_fellow',
  'teaching_assistant',
]);

export const facultyDesignationSchema = z.enum([
  'assistant_professor',
  'associate_professor',
  'professor',
  'head_of_department',
  'dean',
  'lecturer',
  'research_scientist',
  'custom',
]);

export const facultyGenderSchema = z.enum([
  'male',
  'female',
  'other',
  'prefer_not_to_say',
]);

export const facultyListQuerySchema = z.object({
  q: z.string().trim().min(1).max(200).optional(),
  status: facultyStatusSchema.optional(),
  includeDeleted: z.coerce.boolean().optional().default(false),
  campusId: objectIdField.optional(),
  schoolId: objectIdField.optional(),
  departmentId: objectIdField.optional(),
  programId: objectIdField.optional(),
  designation: facultyDesignationSchema.optional(),
  employmentType: facultyEmploymentTypeSchema.optional(),
  joiningDateFrom: z.coerce.date().optional(),
  joiningDateTo: z.coerce.date().optional(),
  experienceMin: z.coerce.number().min(0).max(60).optional(),
  experienceMax: z.coerce.number().min(0).max(60).optional(),
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

export const facultySearchQuerySchema = z.object({
  q: z.string().trim().min(1).max(200),
  page: z.coerce.number().int().min(1).default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGINATION.MAX_LIMIT)
    .default(PAGINATION.DEFAULT_LIMIT),
});

export const facultyIdParamsSchema = z.object({
  id: objectIdField,
});

const facultyBaseFields = {
  employeeId: z.string().trim().min(1).max(64),
  facultyCode: z.string().trim().min(1).max(64),
  campusId: objectIdField.optional().nullable(),
  schoolId: objectIdField.optional().nullable(),
  departmentId: objectIdField.optional().nullable(),
  programIds: z.array(objectIdField).max(50).optional().default([]),
  courseIds: z.array(objectIdField).max(50).optional().default([]),
  academicYearId: objectIdField.optional().nullable(),
  semesterId: objectIdField.optional().nullable(),
  firstName: z.string().trim().min(1).max(80),
  middleName: optionalString(80),
  lastName: z.string().trim().min(1).max(80),
  email: emailField,
  alternateEmail: optionalEmail,
  phone: optionalString(30),
  alternatePhone: optionalString(30),
  profilePhoto: optionalUrl,
  gender: facultyGenderSchema.optional().nullable(),
  dateOfBirth: z.coerce.date().optional().nullable(),
  bloodGroup: optionalString(8),
  nationality: optionalString(80),
  address: optionalString(500),
  city: optionalString(80),
  state: optionalString(80),
  country: optionalString(80),
  postalCode: optionalString(20),
  designation: facultyDesignationSchema,
  customDesignation: optionalString(120),
  employmentType: facultyEmploymentTypeSchema,
  joiningDate: z.coerce.date().optional().nullable(),
  experienceYears: z.coerce.number().min(0).max(60).optional().default(0),
  highestQualification: optionalString(200),
  specialization: optionalString(200),
  researchAreas: z.array(z.string().trim().min(1).max(120)).max(30).optional().default([]),
  bio: optionalString(4000),
  officeRoom: optionalString(80),
  officeHours: optionalString(500),
  linkedin: optionalUrl,
  website: optionalUrl,
  orcid: optionalString(40),
  googleScholar: optionalUrl,
  emergencyContactName: optionalString(120),
  emergencyContactPhone: optionalString(30),
  emergencyContactRelation: optionalString(80),
  isActive: z.boolean().optional().default(true),
  status: facultyStatusSchema.optional().default('active'),
};

const facultyObjectSchema = z.object(facultyBaseFields);

export const createFacultySchema = facultyObjectSchema.superRefine((data, ctx) => {
  if (data.designation === 'custom' && !data.customDesignation?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Custom designation is required',
      path: ['customDesignation'],
    });
  }
});

export const updateFacultySchema = facultyObjectSchema.partial().superRefine((data, ctx) => {
  if (data.designation === 'custom' && data.customDesignation !== undefined && !data.customDesignation?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Custom designation is required',
      path: ['customDesignation'],
    });
  }
});

export const updateFacultyProfileSchema = z.object({
  phone: optionalString(30),
  alternatePhone: optionalString(30),
  alternateEmail: optionalEmail,
  profilePhoto: optionalUrl,
  bio: optionalString(4000),
  officeRoom: optionalString(80),
  officeHours: optionalString(500),
  linkedin: optionalUrl,
  website: optionalUrl,
  orcid: optionalString(40),
  googleScholar: optionalUrl,
  address: optionalString(500),
  city: optionalString(80),
  state: optionalString(80),
  country: optionalString(80),
  postalCode: optionalString(20),
  emergencyContactName: optionalString(120),
  emergencyContactPhone: optionalString(30),
  emergencyContactRelation: optionalString(80),
});

export const facultyBulkIdsSchema = z.object({
  ids: z.array(objectIdField).min(1).max(500),
});

export const facultyBulkStatusSchema = z.object({
  ids: z.array(objectIdField).min(1).max(500),
  status: facultyStatusSchema,
});

export const facultyBulkAssignDepartmentSchema = z.object({
  ids: z.array(objectIdField).min(1).max(500),
  departmentId: objectIdField,
  schoolId: objectIdField.optional().nullable(),
  campusId: objectIdField.optional().nullable(),
});

export const facultyBulkAssignProgramSchema = z.object({
  ids: z.array(objectIdField).min(1).max(500),
  programIds: z.array(objectIdField).min(1).max(50),
  mode: z.enum(['replace', 'append']).optional().default('append'),
});

export const facultyBulkAssignAcademicSchema = z.object({
  ids: z.array(objectIdField).min(1).max(500),
  academicYearId: objectIdField.optional().nullable(),
  semesterId: objectIdField.optional().nullable(),
  /** Course IDs are accepted as placeholders until the Course module exists */
  courseIds: z.array(objectIdField).max(50).optional(),
  mode: z.enum(['replace', 'append']).optional().default('append'),
});

export const facultyImportConfirmSchema = z.object({
  rows: z.array(z.record(z.string(), z.string())).min(1).max(2000),
  dryRun: z.boolean().optional().default(false),
});

export const facultyExportQuerySchema = z.object({
  format: z.enum(['csv', 'excel', 'pdf']).optional().default('csv'),
  q: z.string().trim().min(1).max(200).optional(),
  status: facultyStatusSchema.optional(),
  campusId: objectIdField.optional(),
  schoolId: objectIdField.optional(),
  departmentId: objectIdField.optional(),
  designation: facultyDesignationSchema.optional(),
  employmentType: facultyEmploymentTypeSchema.optional(),
  includeDeleted: z.coerce.boolean().optional().default(false),
});

export const facultyPhotoUploadSchema = z.object({
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  /** Base64 payload without data-URL prefix */
  data: z.string().min(32).max(5_000_000),
});

export type FacultyListQuery = z.infer<typeof facultyListQuerySchema>;
export type FacultySearchQuery = z.infer<typeof facultySearchQuerySchema>;
export type CreateFacultyInput = z.infer<typeof createFacultySchema>;
export type UpdateFacultyInput = z.infer<typeof updateFacultySchema>;
export type UpdateFacultyProfileInput = z.infer<typeof updateFacultyProfileSchema>;
export type FacultyBulkIdsInput = z.infer<typeof facultyBulkIdsSchema>;
export type FacultyBulkStatusInput = z.infer<typeof facultyBulkStatusSchema>;
export type FacultyBulkAssignDepartmentInput = z.infer<typeof facultyBulkAssignDepartmentSchema>;
export type FacultyBulkAssignProgramInput = z.infer<typeof facultyBulkAssignProgramSchema>;
export type FacultyBulkAssignAcademicInput = z.infer<typeof facultyBulkAssignAcademicSchema>;
export type FacultyImportConfirmInput = z.infer<typeof facultyImportConfirmSchema>;
export type FacultyExportQuery = z.infer<typeof facultyExportQuerySchema>;
export type FacultyPhotoUploadInput = z.infer<typeof facultyPhotoUploadSchema>;
