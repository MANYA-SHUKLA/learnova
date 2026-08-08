import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { PRACTICE_DIFFICULTIES, PRACTICE_LANGUAGES } from '@learnova/constants';

const boilerplateSchema = new Schema(
  {
    language: { type: String, enum: PRACTICE_LANGUAGES, required: true },
    code: { type: String, required: true },
  },
  { _id: false },
);

const labProblemSchema = new Schema(
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
    title: { type: String, required: true, trim: true, maxlength: 200, index: true },
    slug: { type: String, required: true, trim: true, maxlength: 120, index: true },
    description: { type: String, default: null },
    problemStatement: { type: String, required: true },
    inputFormat: { type: String, default: null },
    outputFormat: { type: String, default: null },
    constraints: { type: String, default: null },
    sampleInput: { type: String, default: null },
    sampleOutput: { type: String, default: null },
    explanation: { type: String, default: null },
    difficulty: {
      type: String,
      enum: PRACTICE_DIFFICULTIES,
      default: 'medium',
      index: true,
    },
    tags: { type: [String], default: [], index: true },
    memoryLimitMB: { type: Number, default: 256, min: 16, max: 2048 },
    timeLimitMS: { type: Number, default: 2000, min: 100, max: 30_000 },
    allowedLanguages: {
      type: [{ type: String, enum: PRACTICE_LANGUAGES }],
      default: ['python', 'javascript', 'cpp', 'java'],
    },
    boilerplates: { type: [boilerplateSchema], default: [] },
    solutionCode: { type: String, default: null },
    editorial: { type: String, default: null },
    order: { type: Number, default: 0, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: 'lab_problems' },
);

labProblemSchema.index(
  { practiceLabId: 1, slug: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } },
);
labProblemSchema.index({ practiceLabId: 1, order: 1, deletedAt: 1 });
labProblemSchema.index({ institutionId: 1, title: 'text', problemStatement: 'text', tags: 'text' });

export type LabProblemDocument = InferSchemaType<typeof labProblemSchema> & {
  _id: Types.ObjectId;
};

export const LabProblemModel = model('LabProblem', labProblemSchema);
