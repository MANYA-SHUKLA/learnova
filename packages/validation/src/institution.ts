import { z } from 'zod';
import { PAGINATION, REGEX } from '@learnova/constants';

const emailField = z.string().email().toLowerCase().trim();
const objectIdField = z.string().regex(REGEX.OBJECT_ID, 'Invalid ObjectId');
const slugField = z.string().regex(REGEX.SLUG, 'Invalid slug');

export const orgStatusSchema = z.enum(['active', 'inactive', 'archived']);
export const programLevelSchema = z.enum([
  'certificate',
  'diploma',
  'undergraduate',
  'postgraduate',
  'doctoral',
]);
export const semesterTermSchema = z.enum(['odd', 'even', 'summer']);
export const calendarEventTypeSchema = z.enum([
  'semester_start',
  'semester_end',
  'exam_start',
  'exam_end',
  'holiday',
  'event',
]);

export const orgListQuerySchema = z.object({
  q: z.string().trim().min(1).max(200).optional(),
  status: orgStatusSchema.optional(),
  includeDeleted: z.coerce.boolean().optional().default(false),
  schoolId: objectIdField.optional(),
  departmentId: objectIdField.optional(),
  programId: objectIdField.optional(),
  academicYearId: objectIdField.optional(),
  semesterId: objectIdField.optional(),
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

export const idParamsSchema = z.object({
  id: objectIdField,
});

export const createInstitutionSchema = z.object({
  name: z.string().trim().min(2).max(200),
  shortName: z.string().trim().min(1).max(50),
  slug: slugField,
  code: z
    .string()
    .trim()
    .min(2)
    .max(32)
    .regex(/^[A-Za-z0-9_-]+$/, 'Invalid institution code'),
  email: emailField,
  phone: z.string().trim().min(5).max(30).optional().nullable(),
  website: z.string().url().optional().nullable(),
  logo: z.string().url().optional().nullable(),
  favicon: z.string().url().optional().nullable(),
  timezone: z.string().trim().min(1).max(80).default('UTC'),
  currency: z.string().trim().min(3).max(3).default('USD'),
  country: z.string().trim().min(2).max(80),
  state: z.string().trim().max(80).optional().nullable(),
  city: z.string().trim().max(80).optional().nullable(),
  postalCode: z.string().trim().max(20).optional().nullable(),
  address: z.string().trim().max(500).optional().nullable(),
  status: orgStatusSchema.default('active'),
  subscriptionPlan: z.string().trim().min(1).max(50).default('standard'),
  subscriptionStart: z.coerce.date().optional().nullable(),
  subscriptionEnd: z.coerce.date().optional().nullable(),
  maxStudents: z.coerce.number().int().min(1).default(1000),
  maxFaculty: z.coerce.number().int().min(1).default(100),
  maxStorage: z.coerce.number().int().min(1).default(10_240),
});

export const updateInstitutionSchema = createInstitutionSchema.partial();

export const updateInstitutionBrandingSchema = z.object({
  logo: z.string().url().optional().nullable(),
  favicon: z.string().url().optional().nullable(),
});

export const createCampusSchema = z.object({
  name: z.string().trim().min(2).max(200),
  code: z.string().trim().min(1).max(32),
  address: z.string().trim().max(500).optional().nullable(),
  city: z.string().trim().max(80).optional().nullable(),
  state: z.string().trim().max(80).optional().nullable(),
  country: z.string().trim().max(80).optional().nullable(),
  phone: z.string().trim().max(30).optional().nullable(),
  email: emailField.optional().nullable(),
  status: orgStatusSchema.default('active'),
});
export const updateCampusSchema = createCampusSchema.partial();

export const createSchoolSchema = z.object({
  name: z.string().trim().min(2).max(200),
  code: z.string().trim().min(1).max(32),
  description: z.string().trim().max(1000).optional().nullable(),
  status: orgStatusSchema.default('active'),
});
export const updateSchoolSchema = createSchoolSchema.partial();

export const createDepartmentSchema = z.object({
  schoolId: objectIdField,
  name: z.string().trim().min(2).max(200),
  code: z.string().trim().min(1).max(32),
  description: z.string().trim().max(1000).optional().nullable(),
  status: orgStatusSchema.default('active'),
});
export const updateDepartmentSchema = createDepartmentSchema.partial();

export const createProgramSchema = z.object({
  departmentId: objectIdField,
  name: z.string().trim().min(2).max(200),
  code: z.string().trim().min(1).max(32),
  durationYears: z.coerce.number().min(0.5).max(10),
  credits: z.coerce.number().int().min(1).max(500),
  level: programLevelSchema,
  status: orgStatusSchema.default('active'),
});
export const updateProgramSchema = createProgramSchema.partial();

export const createAcademicYearSchema = z.object({
  name: z.string().trim().min(4).max(32),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  isActive: z.boolean().default(false),
  status: orgStatusSchema.default('active'),
});
export const updateAcademicYearSchema = createAcademicYearSchema.partial();

export const createSemesterSchema = z.object({
  academicYearId: objectIdField,
  name: z.string().trim().min(1).max(80),
  number: z.coerce.number().int().min(1).max(20),
  term: semesterTermSchema,
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  status: orgStatusSchema.default('active'),
});
export const updateSemesterSchema = createSemesterSchema.partial();

export const createSectionSchema = z.object({
  programId: objectIdField,
  semesterId: objectIdField,
  name: z.string().trim().min(1).max(20),
  capacity: z.coerce.number().int().min(1).max(500).default(60),
  status: orgStatusSchema.default('active'),
});
export const updateSectionSchema = createSectionSchema.partial();

export const createBatchSchema = z.object({
  programId: objectIdField,
  name: z.string().trim().min(1).max(40),
  year: z.coerce.number().int().min(1990).max(2100),
  status: orgStatusSchema.default('active'),
});
export const updateBatchSchema = createBatchSchema.partial();

export const calendarEventSchema = z.object({
  id: z.string().optional(),
  type: calendarEventTypeSchema,
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export const createAcademicCalendarSchema = z.object({
  academicYearId: objectIdField,
  name: z.string().trim().min(1).max(120),
  events: z.array(calendarEventSchema).default([]),
  status: orgStatusSchema.default('active'),
});
export const updateAcademicCalendarSchema = createAcademicCalendarSchema.partial();

export const updateInstitutionSettingsSchema = z.object({
  language: z.string().trim().min(2).max(10).optional(),
  theme: z.string().trim().min(2).max(40).optional(),
  attendance: z.record(z.unknown()).optional(),
  gradingScale: z.record(z.unknown()).optional(),
  examRules: z.record(z.unknown()).optional(),
  certificateSettings: z.record(z.unknown()).optional(),
  storageSettings: z.record(z.unknown()).optional(),
  aiSettings: z.record(z.unknown()).optional(),
  notificationSettings: z.record(z.unknown()).optional(),
  securitySettings: z.record(z.unknown()).optional(),
});

export type OrgListQuery = z.infer<typeof orgListQuerySchema>;
export type CreateInstitutionInput = z.infer<typeof createInstitutionSchema>;
export type UpdateInstitutionInput = z.infer<typeof updateInstitutionSchema>;
export type CreateCampusInput = z.infer<typeof createCampusSchema>;
export type UpdateCampusInput = z.infer<typeof updateCampusSchema>;
export type CreateSchoolInput = z.infer<typeof createSchoolSchema>;
export type UpdateSchoolInput = z.infer<typeof updateSchoolSchema>;
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
export type CreateProgramInput = z.infer<typeof createProgramSchema>;
export type UpdateProgramInput = z.infer<typeof updateProgramSchema>;
export type CreateAcademicYearInput = z.infer<typeof createAcademicYearSchema>;
export type UpdateAcademicYearInput = z.infer<typeof updateAcademicYearSchema>;
export type CreateSemesterInput = z.infer<typeof createSemesterSchema>;
export type UpdateSemesterInput = z.infer<typeof updateSemesterSchema>;
export type CreateSectionInput = z.infer<typeof createSectionSchema>;
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;
export type CreateBatchInput = z.infer<typeof createBatchSchema>;
export type UpdateBatchInput = z.infer<typeof updateBatchSchema>;
export type CreateAcademicCalendarInput = z.infer<typeof createAcademicCalendarSchema>;
export type UpdateAcademicCalendarInput = z.infer<typeof updateAcademicCalendarSchema>;
export type UpdateInstitutionSettingsInput = z.infer<
  typeof updateInstitutionSettingsSchema
>;
