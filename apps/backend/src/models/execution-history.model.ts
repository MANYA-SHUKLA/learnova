import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { EXECUTION_STATUSES, PRACTICE_LANGUAGES } from '@learnova/constants';

const executionHistorySchema = new Schema(
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
      default: null,
      index: true,
    },
    problemId: {
      type: Schema.Types.ObjectId,
      ref: 'LabProblem',
      default: null,
      index: true,
    },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    language: { type: String, enum: PRACTICE_LANGUAGES, required: true, index: true },
    sourceCode: { type: String, required: true },
    stdin: { type: String, default: null },
    stdout: { type: String, default: null },
    stderr: { type: String, default: null },
    compileOutput: { type: String, default: null },
    status: {
      type: String,
      enum: EXECUTION_STATUSES,
      default: 'queued',
      index: true,
    },
    exitCode: { type: Number, default: null },
    executionTimeMS: { type: Number, default: null },
    memoryKB: { type: Number, default: null },
    submissionId: {
      type: Schema.Types.ObjectId,
      ref: 'StudentCodeSubmission',
      default: null,
      index: true,
    },
    isSubmission: { type: Boolean, default: false, index: true },
    judge0Token: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'execution_histories' },
);

executionHistorySchema.index({ studentId: 1, createdAt: -1 });
executionHistorySchema.index({ institutionId: 1, status: 1, createdAt: -1 });

export type ExecutionHistoryDocument = InferSchemaType<typeof executionHistorySchema> & {
  _id: Types.ObjectId;
};

export const ExecutionHistoryModel = model('ExecutionHistory', executionHistorySchema);
