import { z } from 'zod';
import { REGEX } from '@learnova/constants';

const objectIdField = z.string().regex(REGEX.OBJECT_ID, 'Invalid ObjectId');
const optionalString = (max: number) =>
  z.string().trim().max(max).optional().nullable();

export const enrollmentMethodSchema = z.enum([
  'manual',
  'bulk_import',
  'self_enrollment',
  'invite',
  'api',
]);

export const enrollmentStatusSchema = z.enum([
  'pending',
  'approved',
  'rejected',
  'active',
  'completed',
  'withdrawn',
  'dropped',
  'expired',
]);

export const enrollmentCompletionStatusSchema = z.enum([
  'not_started',
  'in_progress',
  'completed',
]);

export const enrollmentApprovalStatusSchema = z.enum([
  'pending',
  'approved',
  'rejected',
  'not_required',
]);

export const enrollmentListQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  status: enrollmentStatusSchema.optional(),
  approvalStatus: enrollmentApprovalStatusSchema.optional(),
  completionStatus: enrollmentCompletionStatusSchema.optional(),
  enrollmentMethod: enrollmentMethodSchema.optional(),
  studentId: objectIdField.optional(),
  courseId: objectIdField.optional(),
  facultyId: objectIdField.optional(),
  departmentId: objectIdField.optional(),
  programId: objectIdField.optional(),
  academicYearId: objectIdField.optional(),
  semesterId: objectIdField.optional(),
  sectionId: objectIdField.optional(),
  includeDeleted: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z
    .enum(['createdAt', 'enrollmentDate', 'enrollmentNumber', 'status', 'updatedAt'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const enrollmentSearchQuerySchema = enrollmentListQuerySchema.pick({
  q: true,
  page: true,
  limit: true,
  sortBy: true,
  sortOrder: true,
});

export const createEnrollmentSchema = z.object({
  studentId: objectIdField,
  courseId: objectIdField,
  departmentId: objectIdField.optional().nullable(),
  programId: objectIdField.optional().nullable(),
  academicYearId: objectIdField.optional().nullable(),
  semesterId: objectIdField.optional().nullable(),
  sectionId: objectIdField.optional().nullable(),
  facultyId: objectIdField.optional().nullable(),
  enrollmentDate: z.coerce.date().optional(),
  enrollmentMethod: enrollmentMethodSchema.optional().default('manual'),
  status: enrollmentStatusSchema.optional(),
  approvalStatus: enrollmentApprovalStatusSchema.optional(),
  completionStatus: enrollmentCompletionStatusSchema.optional().default('not_started'),
  notes: optionalString(2000),
});

export const updateEnrollmentSchema = createEnrollmentSchema.partial().extend({
  completionDate: z.coerce.date().optional().nullable(),
  withdrawReason: optionalString(1000),
});

export const enrollmentIdParamsSchema = z.object({
  id: objectIdField,
});

export const enrollmentApproveSchema = z.object({
  notes: optionalString(2000),
  facultyId: objectIdField.optional().nullable(),
});

export const enrollmentRejectSchema = z.object({
  notes: optionalString(2000),
  reason: optionalString(1000),
});

export const enrollmentWithdrawSchema = z.object({
  reason: z.string().trim().min(1).max(1000),
});

export const enrollmentCompleteSchema = z.object({
  completionDate: z.coerce.date().optional(),
  notes: optionalString(2000),
});

export const enrollmentBulkIdsSchema = z.object({
  ids: z.array(objectIdField).min(1).max(500),
});

export const enrollmentBulkEnrollSchema = z.object({
  studentIds: z.array(objectIdField).min(1).max(500),
  courseId: objectIdField,
  departmentId: objectIdField.optional().nullable(),
  programId: objectIdField.optional().nullable(),
  academicYearId: objectIdField.optional().nullable(),
  semesterId: objectIdField.optional().nullable(),
  sectionId: objectIdField.optional().nullable(),
  facultyId: objectIdField.optional().nullable(),
  enrollmentMethod: enrollmentMethodSchema.optional().default('manual'),
  notes: optionalString(2000),
});

export const enrollmentBulkAssignFacultySchema = z.object({
  ids: z.array(objectIdField).min(1).max(500),
  facultyId: objectIdField,
});

export const enrollmentSelfEnrollSchema = z.object({
  courseId: objectIdField,
  notes: optionalString(2000),
});

export const enrollmentWaitlistJoinSchema = z.object({
  courseId: objectIdField,
});

export const enrollmentImportConfirmSchema = z.object({
  rows: z.array(z.record(z.string(), z.string())).min(1).max(5000),
  dryRun: z.boolean().optional().default(false),
});

export const enrollmentExportQuerySchema = enrollmentListQuerySchema.extend({
  format: z.enum(['csv', 'excel', 'pdf']).optional().default('csv'),
});

export type EnrollmentListQuery = z.infer<typeof enrollmentListQuerySchema>;
export type EnrollmentSearchQuery = z.infer<typeof enrollmentSearchQuerySchema>;
export type CreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>;
export type UpdateEnrollmentInput = z.infer<typeof updateEnrollmentSchema>;
export type EnrollmentApproveInput = z.infer<typeof enrollmentApproveSchema>;
export type EnrollmentRejectInput = z.infer<typeof enrollmentRejectSchema>;
export type EnrollmentWithdrawInput = z.infer<typeof enrollmentWithdrawSchema>;
export type EnrollmentCompleteInput = z.infer<typeof enrollmentCompleteSchema>;
export type EnrollmentBulkIdsInput = z.infer<typeof enrollmentBulkIdsSchema>;
export type EnrollmentBulkEnrollInput = z.infer<typeof enrollmentBulkEnrollSchema>;
export type EnrollmentBulkAssignFacultyInput = z.infer<
  typeof enrollmentBulkAssignFacultySchema
>;
export type EnrollmentSelfEnrollInput = z.infer<typeof enrollmentSelfEnrollSchema>;
export type EnrollmentWaitlistJoinInput = z.infer<typeof enrollmentWaitlistJoinSchema>;
export type EnrollmentImportConfirmInput = z.infer<typeof enrollmentImportConfirmSchema>;
export type EnrollmentExportQuery = z.infer<typeof enrollmentExportQuerySchema>;
