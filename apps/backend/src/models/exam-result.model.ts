import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const examResultSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    attemptId: {
      type: Schema.Types.ObjectId,
      ref: 'ExamAttempt',
      required: true,
      unique: true,
      index: true,
    },
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    totalQuestions: { type: Number, default: 0, min: 0 },
    correct: { type: Number, default: 0, min: 0 },
    incorrect: { type: Number, default: 0, min: 0 },
    skipped: { type: Number, default: 0, min: 0 },
    score: { type: Number, default: 0, min: 0 },
    percentage: { type: Number, default: 0, min: 0, max: 100 },
    passed: { type: Boolean, default: false, index: true },
    rank: { type: Number, default: null, min: 1 },
    releasedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'exam_results' },
);

examResultSchema.index({ institutionId: 1, examId: 1, score: -1 });

export type ExamResultDocument = InferSchemaType<typeof examResultSchema> & {
  _id: Types.ObjectId;
};

export const ExamResultModel = model('ExamResult', examResultSchema);
