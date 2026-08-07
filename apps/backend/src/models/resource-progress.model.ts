import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const LEARNING_STATUSES = ['not_started', 'in_progress', 'completed', 'paused'] as const;

const resourceProgressSchema = new Schema(
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
    resourceId: {
      type: Schema.Types.ObjectId,
      ref: 'CourseResource',
      required: true,
      index: true,
    },
    lessonId: {
      type: Schema.Types.ObjectId,
      ref: 'CourseLesson',
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
    downloaded: { type: Boolean, default: false },
    viewed: { type: Boolean, default: false },
    completed: { type: Boolean, default: false, index: true },
    timeSpentSeconds: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, collection: 'resource_progress' },
);

resourceProgressSchema.index({ studentId: 1, resourceId: 1 }, { unique: true });
resourceProgressSchema.index({ institutionId: 1, studentId: 1, courseId: 1 });
resourceProgressSchema.index({ institutionId: 1, studentId: 1, lessonId: 1 });

export type ResourceProgressDocument = InferSchemaType<typeof resourceProgressSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const ResourceProgressModel = model<ResourceProgressDocument>(
  'ResourceProgress',
  resourceProgressSchema,
);
