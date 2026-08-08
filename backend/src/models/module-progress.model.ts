import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const LEARNING_STATUSES = ['not_started', 'in_progress', 'completed', 'paused'] as const;

const moduleProgressSchema = new Schema(
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
    completionPercentage: { type: Number, default: 0, min: 0, max: 100 },
    status: {
      type: String,
      enum: LEARNING_STATUSES,
      default: 'not_started',
      index: true,
    },
    timeSpentMinutes: { type: Number, default: 0, min: 0 },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null, index: true },
    lastAccessedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'module_progress' },
);

moduleProgressSchema.index({ institutionId: 1, studentId: 1, moduleId: 1 }, { unique: true });
moduleProgressSchema.index({ institutionId: 1, studentId: 1, courseId: 1 });
moduleProgressSchema.index({ institutionId: 1, courseId: 1, status: 1 });

export type ModuleProgressDocument = InferSchemaType<typeof moduleProgressSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const ModuleProgressModel = model<ModuleProgressDocument>(
  'ModuleProgress',
  moduleProgressSchema,
);
