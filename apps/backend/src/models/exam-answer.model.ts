import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const examAnswerSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    attemptId: { type: Schema.Types.ObjectId, ref: 'ExamAttempt', required: true, index: true },
    questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true, index: true },
    selectedOptionIds: { type: [String], default: [] },
    textAnswer: { type: String, default: null },
    matchAnswers: { type: Schema.Types.Mixed, default: {} },
    isCorrect: { type: Boolean, default: null },
    marksAwarded: { type: Number, default: 0 },
    timeSpentSeconds: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, collection: 'exam_answers' },
);

examAnswerSchema.index({ attemptId: 1, questionId: 1 }, { unique: true });

export type ExamAnswerDocument = InferSchemaType<typeof examAnswerSchema> & {
  _id: Types.ObjectId;
};

export const ExamAnswerModel = model('ExamAnswer', examAnswerSchema);
