import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

export const LEARNING_ACTIVITY_TYPES = [
  'course_started',
  'lesson_opened',
  'lesson_completed',
  'module_completed',
  'course_completed',
  'resource_viewed',
  'resource_downloaded',
  'bookmark_created',
  'note_created',
  'session_started',
  'session_ended',
] as const;

export type LearningActivityEventType = (typeof LEARNING_ACTIVITY_TYPES)[number];

const learningActivitySchema = new Schema(
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
      default: null,
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
    resourceId: {
      type: Schema.Types.ObjectId,
      ref: 'CourseResource',
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: LEARNING_ACTIVITY_TYPES,
      required: true,
      index: true,
    },
    durationSeconds: { type: Number, default: 0, min: 0 },
    metadata: { type: Schema.Types.Mixed, default: null },
    occurredAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'learning_activities' },
);

learningActivitySchema.index({ institutionId: 1, studentId: 1, occurredAt: -1 });
learningActivitySchema.index({ institutionId: 1, courseId: 1, occurredAt: -1 });
learningActivitySchema.index({ institutionId: 1, type: 1, occurredAt: -1 });

export type LearningActivityDocument = InferSchemaType<typeof learningActivitySchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
};

export const LearningActivityModel = model<LearningActivityDocument>(
  'LearningActivity',
  learningActivitySchema,
);
