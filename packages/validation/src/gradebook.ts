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

export const gradebookListQuerySchema = z.object({
  courseId: objectIdField.optional(),
  studentId: objectIdField.optional(),
  activityKind: gradebookActivityKindSchema.optional(),
  status: gradebookEntryStatusSchema.optional(),
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
  gradingMethod: z.enum(['manual', 'rubric', 'pass_fail', 'marks', 'percentage', 'auto']).default('marks'),
});

export const upsertWeightSchemeSchema = z.object({
  courseId: objectIdField,
  assignmentWeight: z.number().min(0).max(100).default(25),
  labWeight: z.number().min(0).max(100).default(10),
  quizWeight: z.number().min(0).max(100).default(15),
  examWeight: z.number().min(0).max(100).default(30),
  projectWeight: z.number().min(0).max(100).default(20),
  attemptPolicy: z.enum(['best', 'latest', 'average']).default('best'),
});

export const finalizeCourseGradesSchema = z.object({
  courseId: objectIdField,
});

export const gradebookCourseIdParamsSchema = z.object({ courseId: objectIdField });

export type GradebookListQuery = z.infer<typeof gradebookListQuerySchema>;
export type IngestGradebookSourceInput = z.infer<typeof ingestGradebookSourceSchema>;
export type SyncCourseGradebookInput = z.infer<typeof syncCourseGradebookSchema>;
export type AssignProjectGradeInput = z.infer<typeof assignProjectGradeSchema>;
export type UpsertWeightSchemeInput = z.infer<typeof upsertWeightSchemeSchema>;
export type FinalizeCourseGradesInput = z.infer<typeof finalizeCourseGradesSchema>;
