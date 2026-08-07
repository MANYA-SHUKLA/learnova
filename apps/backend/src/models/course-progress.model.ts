import { Schema, model, type InferSchemaType } from 'mongoose';

const courseProgressSchema = new Schema(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    moduleId: {
      type: Schema.Types.ObjectId,
      ref: 'CourseModule',
      default: null,
      index: true,
    },
    lessonId: {
      type: Schema.Types.ObjectId,
      ref: 'CourseLesson',
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started',
      index: true,
    },
    progressPercent: { type: Number, default: 0, min: 0, max: 100 },
    lastAccessedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null, index: true },
    timeSpentMinutes: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, collection: 'course_progress' },
);

courseProgressSchema.index({ courseId: 1, studentId: 1 }, { unique: true });
courseProgressSchema.index({ studentId: 1, status: 1 });
courseProgressSchema.index({ courseId: 1, status: 1 });

export type CourseProgressDocument = InferSchemaType<typeof courseProgressSchema> & {
  _id: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const CourseProgressModel = model<CourseProgressDocument>(
  'CourseProgress',
  courseProgressSchema,
);
