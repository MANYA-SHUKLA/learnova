import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const learningSessionSchema = new Schema(
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
    lessonId: {
      type: Schema.Types.ObjectId,
      ref: 'CourseLesson',
      default: null,
      index: true,
    },
    startedAt: { type: Date, default: Date.now, index: true },
    endedAt: { type: Date, default: null, index: true },
    idleSeconds: { type: Number, default: 0, min: 0 },
    activeSeconds: { type: Number, default: 0, min: 0 },
    totalSeconds: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, collection: 'learning_sessions' },
);

learningSessionSchema.index({ institutionId: 1, studentId: 1, startedAt: -1 });
learningSessionSchema.index({ institutionId: 1, studentId: 1, endedAt: 1 });
learningSessionSchema.index({ institutionId: 1, courseId: 1, startedAt: -1 });

export type LearningSessionDocument = InferSchemaType<typeof learningSessionSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const LearningSessionModel = model<LearningSessionDocument>(
  'LearningSession',
  learningSessionSchema,
);
