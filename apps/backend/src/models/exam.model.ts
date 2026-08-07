import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import {
  EXAM_STATUSES,
  EXAM_TYPES,
  EXAM_VISIBILITIES,
  PROCTORING_MODES,
  SECURE_BROWSER_POLICIES,
} from '@learnova/constants';

export { EXAM_TYPES, EXAM_STATUSES, EXAM_VISIBILITIES, PROCTORING_MODES, SECURE_BROWSER_POLICIES };

const examScheduleSchema = new Schema(
  {
    registrationOpensAt: { type: Date, default: null },
    registrationClosesAt: { type: Date, default: null },
    checkInOpensAt: { type: Date, default: null },
    startsAt: { type: Date, required: true, index: true },
    endsAt: { type: Date, required: true, index: true },
    lateEntryMinutes: { type: Number, default: 15, min: 0 },
    gracePeriodMinutes: { type: Number, default: 5, min: 0 },
  },
  { _id: false },
);

const examProctoringSchema = new Schema(
  {
    mode: { type: String, enum: PROCTORING_MODES, default: 'none' },
    secureBrowser: { type: String, enum: SECURE_BROWSER_POLICIES, default: 'recommended' },
    requireWebcam: { type: Boolean, default: false },
    requireMicrophone: { type: Boolean, default: false },
    blockCopyPaste: { type: Boolean, default: true },
    blockRightClick: { type: Boolean, default: true },
    blockNewTabs: { type: Boolean, default: true },
    requireFullscreen: { type: Boolean, default: true },
    maxTabSwitches: { type: Number, default: 3, min: 0 },
    autoTerminateOnViolation: { type: Boolean, default: false },
    invigilatorIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { _id: false },
);

const examRulesSchema = new Schema(
  {
    passingMarks: { type: Number, default: 40, min: 0 },
    totalMarks: { type: Number, default: 100, min: 0 },
    durationMinutes: { type: Number, default: 120, min: 1 },
    attemptLimit: { type: Number, default: 1, min: 1, max: 3 },
    negativeMarking: { type: Boolean, default: false },
    negativeMarkValue: { type: Number, default: 0.25, min: 0 },
    shuffleQuestions: { type: Boolean, default: true },
    shuffleOptions: { type: Boolean, default: true },
    showResultsAfter: {
      type: String,
      enum: ['immediate', 'schedule_end', 'manual_release'],
      default: 'schedule_end',
    },
    allowReview: { type: Boolean, default: false },
    showCorrectAnswers: { type: Boolean, default: false },
  },
  { _id: false },
);

const examSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    moduleId: { type: Schema.Types.ObjectId, ref: 'CourseModule', default: null, index: true },
    lessonId: { type: Schema.Types.ObjectId, ref: 'CourseLesson', default: null, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200, index: true },
    slug: { type: String, required: true, trim: true, lowercase: true, maxlength: 120 },
    description: { type: String, default: null },
    instructions: { type: String, default: null },
    examType: { type: String, enum: EXAM_TYPES, default: 'internal', index: true },
    visibility: { type: String, enum: EXAM_VISIBILITIES, default: 'enrolled', index: true },
    status: { type: String, enum: EXAM_STATUSES, default: 'draft', index: true },
    schedule: { type: examScheduleSchema, required: true },
    proctoring: { type: examProctoringSchema, default: () => ({}) },
    rules: { type: examRulesSchema, default: () => ({}) },
    sectionIds: [{ type: Schema.Types.ObjectId, ref: 'ExamSection' }],
    questionIds: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
    seatingEnabled: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: 'exams' },
);

examSchema.index({ institutionId: 1, courseId: 1, status: 1, deletedAt: 1 });
examSchema.index(
  { institutionId: 1, slug: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } },
);
examSchema.index({ institutionId: 1, title: 'text', description: 'text' });
examSchema.index({ 'schedule.startsAt': 1, 'schedule.endsAt': 1 });

export type ExamDocument = InferSchemaType<typeof examSchema> & { _id: Types.ObjectId };

export const ExamModel = model('Exam', examSchema);
