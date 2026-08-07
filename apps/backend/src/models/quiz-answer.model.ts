import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const quizAnswerSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    attemptId: { type: Schema.Types.ObjectId, ref: 'QuizAttempt', required: true, index: true },
    questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true, index: true },
    selectedOptionIds: { type: [String], default: [] },
    textAnswer: { type: String, default: null },
    matchAnswers: { type: Schema.Types.Mixed, default: {} },
    isCorrect: { type: Boolean, default: null },
    marksAwarded: { type: Number, default: 0 },
    timeSpentSeconds: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, collection: 'quiz_answers' },
);

quizAnswerSchema.index({ attemptId: 1, questionId: 1 }, { unique: true });

export type QuizAnswerDocument = InferSchemaType<typeof quizAnswerSchema> & {
  _id: Types.ObjectId;
};

export const QuizAnswerModel = model('QuizAnswer', quizAnswerSchema);
