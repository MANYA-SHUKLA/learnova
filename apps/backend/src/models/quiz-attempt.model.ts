import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { QUIZ_ATTEMPT_STATUSES } from '@learnova/constants';

export { QUIZ_ATTEMPT_STATUSES };

const quizAttemptSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    quizId: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    attemptNumber: { type: Number, required: true, min: 1 },
    startedAt: { type: Date, required: true, default: Date.now },
    submittedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: QUIZ_ATTEMPT_STATUSES,
      default: 'started',
      index: true,
    },
    score: { type: Number, default: 0, min: 0 },
    percentage: { type: Number, default: 0, min: 0, max: 100 },
    timeTakenSeconds: { type: Number, default: 0, min: 0 },
    autoSubmitted: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'quiz_attempts' },
);

quizAttemptSchema.index({ institutionId: 1, quizId: 1, studentId: 1, attemptNumber: 1 });
quizAttemptSchema.index({ institutionId: 1, studentId: 1, status: 1 });

export type QuizAttemptDocument = InferSchemaType<typeof quizAttemptSchema> & {
  _id: Types.ObjectId;
};

export const QuizAttemptModel = model('QuizAttempt', quizAttemptSchema);
