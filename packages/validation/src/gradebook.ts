import { z } from 'zod';
import { REGEX } from '@learnova/constants';

const objectIdField = z.string().regex(REGEX.OBJECT_ID, 'Invalid ObjectId');

export const gradebookActivityKindSchema = z.enum([
  'assignment',
  'lab',
  'quiz',
  'exam',
  'project',
]);

export const gradebookEntryStatusSchema = z.enum([
  'pending',
  'final',
  'exported',
  'superseded',
]);

export const courseGradeStatusSchema = z.enum([
  'draft',
  'faculty_review',
  'published',
  'revision',
  'archived',
  'finalized',
]);

export const gradeAppealStatusSchema = z.enum([
  'pending',
  'under_review',
  'accepted',
  'rejected',
]);

export const gradeCommentVisibilitySchema = z.enum(['internal', 'faculty', 'student']);

export const gradebookListQuerySchema = z.object({
  courseId: objectIdField.optional(),
  studentId: objectIdField.optional(),
  semesterId: objectIdField.optional(),
  facultyId: objectIdField.optional(),
  departmentId: objectIdField.optional(),
  activityKind: gradebookActivityKindSchema.optional(),
  status: gradebookEntryStatusSchema.optional(),
  courseGradeStatus: courseGradeStatusSchema.optional(),
  locked: z.coerce.boolean().optional(),
  published: z.coerce.boolean().optional(),
  hasAppeals: z.coerce.boolean().optional(),
  result: z.enum(['pass', 'fail', 'incomplete']).optional(),
  q: z.string().trim().max(200).optional(),
  sortBy: z
    .enum(['studentId', 'percentage', 'letterGrade', 'finalMarks', 'createdAt'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const ingestGradebookSourceSchema = z.object({
  activityKind: gradebookActivityKindSchema,
  sourceRefId: objectIdField,
});

export const syncCourseGradebookSchema = z.object({
  courseId: objectIdField,
});

export const assignProjectGradeSchema = z.object({
  submissionId: objectIdField,
  marksObtained: z.number().min(0),
  totalMarks: z.number().min(0).optional(),
  passingMarks: z.number().min(0).optional(),
  feedback: z.string().trim().max(5000).optional().nullable(),
  gradingMethod: z
    .enum(['manual', 'rubric', 'pass_fail', 'marks', 'percentage', 'auto'])
    .default('marks'),
});

export const upsertWeightSchemeSchema = z.object({
  courseId: objectIdField,
  assignmentWeight: z.number().min(0).max(100).default(20),
  labWeight: z.number().min(0).max(100).default(10),
  quizWeight: z.number().min(0).max(100).default(10),
  examWeight: z.number().min(0).max(100).optional(),
  midtermWeight: z.number().min(0).max(100).default(20),
  finalExamWeight: z.number().min(0).max(100).default(30),
  projectWeight: z.number().min(0).max(100).default(10),
  attendanceWeight: z.number().min(0).max(100).default(0),
  extraCreditWeight: z.number().min(0).max(100).default(0),
  attemptPolicy: z.enum(['best', 'latest', 'average']).default('best'),
  scaleId: z.string().trim().max(64).optional().nullable(),
});

export const finalizeCourseGradesSchema = z.object({
  courseId: objectIdField,
});

export const publishCourseGradesSchema = z.object({
  courseId: objectIdField,
  studentIds: z.array(objectIdField).optional(),
});

export const lockCourseGradesSchema = z.object({
  courseId: objectIdField,
  studentIds: z.array(objectIdField).optional(),
  reason: z.string().trim().max(500).optional(),
});

export const unlockCourseGradesSchema = z.object({
  courseId: objectIdField,
  studentIds: z.array(objectIdField).optional(),
  reason: z.string().trim().max(500).min(1),
});

export const gradebookBulkActionSchema = z.object({
  courseId: objectIdField,
  action: z.enum(['publish', 'lock', 'unlock', 'recalculate', 'export']),
  studentIds: z.array(objectIdField).optional(),
});

export const createGradeAppealSchema = z.object({
  courseGradeId: objectIdField,
  reason: z.string().trim().min(10).max(5000),
});

export const resolveGradeAppealSchema = z.object({
  appealId: objectIdField,
  status: z.enum(['accepted', 'rejected']),
  resolutionNotes: z.string().trim().max(5000).optional(),
});

export const createGradeCommentSchema = z.object({
  courseGradeId: objectIdField.optional(),
  gradebookEntryId: objectIdField.optional(),
  courseId: objectIdField,
  studentId: objectIdField,
  visibility: gradeCommentVisibilitySchema.default('faculty'),
  body: z.string().trim().min(1).max(5000),
});

export const gradeReportQuerySchema = z.object({
  type: z.enum(['student', 'course', 'department', 'semester', 'program', 'institution']),
  courseId: objectIdField.optional(),
  studentId: objectIdField.optional(),
  semesterId: objectIdField.optional(),
  departmentId: objectIdField.optional(),
  programId: objectIdField.optional(),
  format: z.enum(['json', 'csv']).optional().default('json'),
});

export const semesterGradeQuerySchema = z.object({
  studentId: objectIdField.optional(),
  semesterId: objectIdField.optional(),
});

export const gradebookCourseIdParamsSchema = z.object({ courseId: objectIdField });
export const gradeAppealIdParamsSchema = z.object({ appealId: objectIdField });

export type GradebookListQuery = z.infer<typeof gradebookListQuerySchema>;
export type IngestGradebookSourceInput = z.infer<typeof ingestGradebookSourceSchema>;
export type SyncCourseGradebookInput = z.infer<typeof syncCourseGradebookSchema>;
export type AssignProjectGradeInput = z.infer<typeof assignProjectGradeSchema>;
export type UpsertWeightSchemeInput = z.infer<typeof upsertWeightSchemeSchema>;
export type FinalizeCourseGradesInput = z.infer<typeof finalizeCourseGradesSchema>;
export type PublishCourseGradesInput = z.infer<typeof publishCourseGradesSchema>;
export type LockCourseGradesInput = z.infer<typeof lockCourseGradesSchema>;
export type UnlockCourseGradesInput = z.infer<typeof unlockCourseGradesSchema>;
export type GradebookBulkActionInput = z.infer<typeof gradebookBulkActionSchema>;
export type CreateGradeAppealInput = z.infer<typeof createGradeAppealSchema>;
export type ResolveGradeAppealInput = z.infer<typeof resolveGradeAppealSchema>;
export type CreateGradeCommentInput = z.infer<typeof createGradeCommentSchema>;
export type GradeReportQuery = z.infer<typeof gradeReportQuerySchema>;
export type SemesterGradeQuery = z.infer<typeof semesterGradeQuerySchema>;
