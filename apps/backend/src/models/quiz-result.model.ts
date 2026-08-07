import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const quizResultSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    attemptId: {
      type: Schema.Types.ObjectId,
      ref: 'QuizAttempt',
      required: true,
      unique: true,
      index: true,
    },
    quizId: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    totalQuestions: { type: Number, default: 0, min: 0 },
    correct: { type: Number, default: 0, min: 0 },
    incorrect: { type: Number, default: 0, min: 0 },
    skipped: { type: Number, default: 0, min: 0 },
    score: { type: Number, default: 0, min: 0 },
    percentage: { type: Number, default: 0, min: 0, max: 100 },
    passed: { type: Boolean, default: false, index: true },
    rank: { type: Number, default: null, min: 1 },
  },
  { timestamps: true, collection: 'quiz_results' },
);

quizResultSchema.index({ institutionId: 1, quizId: 1, score: -1 });

export type QuizResultDocument = InferSchemaType<typeof quizResultSchema> & {
  _id: Types.ObjectId;
};

export const QuizResultModel = model('QuizResult', quizResultSchema);
