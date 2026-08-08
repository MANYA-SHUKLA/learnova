import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const LEARNING_STATUSES = ['not_started', 'in_progress', 'completed', 'paused'] as const;

const resumePositionSchema = new Schema(
  {
    scrollY: { type: Number, default: null },
    videoSeconds: { type: Number, default: null },
    markdownOffset: { type: Number, default: null },
    lastResourceId: { type: Schema.Types.ObjectId, ref: 'CourseResource', default: null },
  },
  { _id: false },
);

const courseProgressSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    enrollmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Enrollment',
      required: true,
      index: true,
    },
    progressPercentage: { type: Number, default: 0, min: 0, max: 100 },
    status: {
      type: String,
      enum: LEARNING_STATUSES,
      default: 'not_started',
      index: true,
    },
    startedAt: { type: Date, default: null },
    lastAccessedAt: { type: Date, default: null, index: true },
    completedAt: { type: Date, default: null, index: true },
    estimatedRemainingMinutes: { type: Number, default: 0, min: 0 },
    timeSpentMinutes: { type: Number, default: 0, min: 0 },
    currentModuleId: {
      type: Schema.Types.ObjectId,
      ref: 'CourseModule',
      default: null,
      index: true,
    },
    currentLessonId: {
      type: Schema.Types.ObjectId,
      ref: 'CourseLesson',
      default: null,
      index: true,
    },
    resumePosition: {
      type: resumePositionSchema,
      default: () => ({
        scrollY: null,
        videoSeconds: null,
        markdownOffset: null,
        lastResourceId: null,
      }),
    },
    bookmarksCount: { type: Number, default: 0, min: 0 },
    notesCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, collection: 'course_progress' },
);

courseProgressSchema.index({ institutionId: 1, studentId: 1, courseId: 1 }, { unique: true });
courseProgressSchema.index({ institutionId: 1, studentId: 1, status: 1 });
courseProgressSchema.index({ institutionId: 1, courseId: 1, status: 1 });
courseProgressSchema.index({ institutionId: 1, enrollmentId: 1 });

export type CourseProgressDocument = InferSchemaType<typeof courseProgressSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const CourseProgressModel = model<CourseProgressDocument>(
  'CourseProgress',
  courseProgressSchema,
);
