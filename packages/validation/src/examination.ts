import { z } from 'zod';
import { REGEX } from '@learnova/constants';
import { assessmentLifecycleStatusSchema, assessmentVisibilitySchema } from './assessment.js';
import { quizSectionSchema } from './quiz.js';

const objectIdField = z.string().regex(REGEX.OBJECT_ID, 'Invalid ObjectId');
const optionalString = (max: number) => z.string().trim().max(max).optional().nullable();

export const examTypeSchema = z.enum([
  'midterm',
  'final',
  'internal',
  'external',
  'practical',
  'viva',
]);

export const examStatusSchema = z.enum([
  'draft',
  'scheduled',
  'published',
  'in_progress',
  'completed',
  'archived',
  'cancelled',
]);

export const examVisibilitySchema = assessmentVisibilitySchema;

export const proctoringModeSchema = z.enum(['none', 'live', 'record_review', 'ai_assisted']);

export const secureBrowserPolicySchema = z.enum(['off', 'recommended', 'required']);

export const examAttemptStatusSchema = z.enum([
  'scheduled',
  'checked_in',
  'started',
  'submitted',
  'completed',
  'expired',
  'terminated',
  'absent',
]);

export const proctorEventTypeSchema = z.enum([
  'session_started',
  'session_ended',
  'tab_switch',
  'fullscreen_exit',
  'camera_off',
  'microphone_off',
  'suspicious_activity',
  'manual_flag',
  'manual_clear',
  'attempt_terminated',
]);

export const examScheduleSchema = z.object({
  registrationOpensAt: z.coerce.date().optional().nullable(),
  registrationClosesAt: z.coerce.date().optional().nullable(),
  checkInOpensAt: z.coerce.date().optional().nullable(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  lateEntryMinutes: z.number().int().min(0).max(120).default(15),
  gracePeriodMinutes: z.number().int().min(0).max(60).default(5),
});

export const examProctoringPolicySchema = z.object({
  mode: proctoringModeSchema.default('none'),
  secureBrowser: secureBrowserPolicySchema.default('recommended'),
  requireWebcam: z.boolean().default(false),
  requireMicrophone: z.boolean().default(false),
  blockCopyPaste: z.boolean().default(true),
  blockRightClick: z.boolean().default(true),
  blockNewTabs: z.boolean().default(true),
  requireFullscreen: z.boolean().default(true),
  maxTabSwitches: z.number().int().min(0).max(50).default(3),
  autoTerminateOnViolation: z.boolean().default(false),
  invigilatorIds: z.array(objectIdField).max(50).optional().default([]),
});

export const examRulesSchema = z.object({
  passingMarks: z.number().min(0).max(10000).default(40),
  totalMarks: z.number().min(0).max(10000).default(100),
  durationMinutes: z.number().int().min(1).max(600).default(120),
  attemptLimit: z.number().int().min(1).max(3).default(1),
  negativeMarking: z.boolean().default(false),
  negativeMarkValue: z.number().min(0).max(10).default(0.25),
  shuffleQuestions: z.boolean().default(true),
  shuffleOptions: z.boolean().default(true),
  showResultsAfter: z.enum(['immediate', 'schedule_end', 'manual_release']).default('schedule_end'),
  allowReview: z.boolean().default(false),
  showCorrectAnswers: z.boolean().default(false),
});

export const createExamSchema = z.object({
  courseId: objectIdField,
  moduleId: objectIdField.optional().nullable(),
  lessonId: objectIdField.optional().nullable(),
  title: z.string().trim().min(1).max(200),
  description: optionalString(5000),
  instructions: optionalString(5000),
  examType: examTypeSchema.default('internal'),
  visibility: examVisibilitySchema.default('enrolled'),
  schedule: examScheduleSchema,
  proctoring: examProctoringPolicySchema.optional().default({}),
  rules: examRulesSchema.optional().default({}),
  seatingEnabled: z.boolean().default(false),
  sections: z.array(quizSectionSchema).max(20).optional().default([]),
  questionIds: z.array(objectIdField).max(500).optional().default([]),
});

export const updateExamSchema = createExamSchema.partial().omit({ courseId: true });

export const examListQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  courseId: objectIdField.optional(),
  status: examStatusSchema.optional(),
  examType: examTypeSchema.optional(),
  published: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'title', 'startsAt', 'endsAt'])
    .optional()
    .default('startsAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const examIdParamsSchema = z.object({ id: objectIdField });
export const attemptIdParamsSchema = z.object({ id: objectIdField });

export const checkInExamSchema = z.object({ examId: objectIdField, seatNumber: optionalString(20) });

export const startExamAttemptSchema = z.object({
  examId: objectIdField,
  secureBrowserAcknowledged: z.boolean().optional().default(false),
  clientFingerprint: optionalString(500),
});

export const submitExamAnswerSchema = z.object({
  questionId: objectIdField,
  selectedOptionIds: z.array(objectIdField).max(20).optional().default([]),
  textAnswer: optionalString(5000),
  matchAnswers: z.record(z.string(), z.string()).optional().default({}),
  timeSpentSeconds: z.number().int().min(0).max(86400).optional().default(0),
});

export const submitExamSchema = z.object({
  attemptId: objectIdField,
  answers: z.array(submitExamAnswerSchema).max(500).optional().default([]),
});

export const proctorEventSchema = z.object({
  attemptId: objectIdField,
  eventType: proctorEventTypeSchema,
  severity: z.enum(['info', 'warning', 'critical']).optional().default('info'),
  message: optionalString(1000),
  metadata: z.record(z.unknown()).optional().default({}),
});

export const examBulkActionSchema = z.object({
  ids: z.array(objectIdField).min(1).max(100),
  action: z.enum(['publish', 'schedule', 'archive', 'cancel', 'duplicate', 'delete']),
});

export const assignSeatingSchema = z.object({
  examId: objectIdField,
  assignments: z
    .array(
      z.object({
        studentId: objectIdField,
        seatNumber: z.string().trim().min(1).max(20),
        room: optionalString(50),
        row: optionalString(10),
        column: optionalString(10),
      }),
    )
    .min(1)
    .max(500),
});

export type CreateExamInput = z.infer<typeof createExamSchema>;
export type UpdateExamInput = z.infer<typeof updateExamSchema>;
export type ExamListQuery = z.infer<typeof examListQuerySchema>;
export type CheckInExamInput = z.infer<typeof checkInExamSchema>;
export type StartExamAttemptInput = z.infer<typeof startExamAttemptSchema>;
export type SubmitExamInput = z.infer<typeof submitExamSchema>;
export type SubmitExamAnswerInput = z.infer<typeof submitExamAnswerSchema>;
export type ProctorEventInput = z.infer<typeof proctorEventSchema>;
export type ExamBulkActionInput = z.infer<typeof examBulkActionSchema>;
export type AssignSeatingInput = z.infer<typeof assignSeatingSchema>;
