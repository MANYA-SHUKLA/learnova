import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const labProgressSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    practiceLabId: {
      type: Schema.Types.ObjectId,
      ref: 'PracticeLab',
      required: true,
      index: true,
    },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    problemsSolved: { type: Number, default: 0, min: 0 },
    totalProblems: { type: Number, default: 0, min: 0 },
    attempts: { type: Number, default: 0, min: 0 },
    accepted: { type: Number, default: 0, min: 0 },
    wrongAnswers: { type: Number, default: 0, min: 0 },
    runtimeErrors: { type: Number, default: 0, min: 0 },
    compilationErrors: { type: Number, default: 0, min: 0 },
    timeSpentSeconds: { type: Number, default: 0, min: 0 },
    successRate: { type: Number, default: 0, min: 0, max: 100 },
    streakDays: { type: Number, default: 0, min: 0 },
    lastSolvedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'lab_progress' },
);

labProgressSchema.index(
  { institutionId: 1, practiceLabId: 1, studentId: 1 },
  { unique: true },
);

export type LabProgressDocument = InferSchemaType<typeof labProgressSchema> & {
  _id: Types.ObjectId;
};

export const LabProgressModel = model('LabProgress', labProgressSchema);
