import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const LEARNING_STATUSES = ['not_started', 'in_progress', 'completed', 'paused'] as const;

const lessonProgressSchema = new Schema(
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
    lessonId: {
      type: Schema.Types.ObjectId,
      ref: 'CourseLesson',
      required: true,
      index: true,
    },
    moduleId: {
      type: Schema.Types.ObjectId,
      ref: 'CourseModule',
      required: true,
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: LEARNING_STATUSES,
      default: 'not_started',
      index: true,
    },
    watchPercentage: { type: Number, default: 0, min: 0, max: 100 },
    readingPercentage: { type: Number, default: 0, min: 0, max: 100 },
    timeSpentSeconds: { type: Number, default: 0, min: 0 },
    completed: { type: Boolean, default: false, index: true },
    completedAt: { type: Date, default: null, index: true },
    lastPosition: { type: Number, default: 0, min: 0 },
    lastAccessedAt: { type: Date, default: null },
    visitCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, collection: 'lesson_progress' },
);

lessonProgressSchema.index({ studentId: 1, lessonId: 1 }, { unique: true });
lessonProgressSchema.index({ institutionId: 1, studentId: 1, courseId: 1 });
lessonProgressSchema.index({ institutionId: 1, studentId: 1, moduleId: 1 });
lessonProgressSchema.index({ institutionId: 1, courseId: 1, status: 1 });

export type LessonProgressDocument = InferSchemaType<typeof lessonProgressSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const LessonProgressModel = model<LessonProgressDocument>(
  'LessonProgress',
  lessonProgressSchema,
);
