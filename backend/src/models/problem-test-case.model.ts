import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { TEST_CASE_VISIBILITIES } from '@learnova/constants';

const problemTestCaseSchema = new Schema(
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
    problemId: {
      type: Schema.Types.ObjectId,
      ref: 'LabProblem',
      required: true,
      index: true,
    },
    input: { type: String, default: '' },
    expectedOutput: { type: String, default: '' },
    visibility: {
      type: String,
      enum: TEST_CASE_VISIBILITIES,
      default: 'hidden',
      index: true,
    },
    weight: { type: Number, default: 1, min: 0, max: 1000 },
    timeoutMS: { type: Number, default: null },
    memoryLimitMB: { type: Number, default: null },
    order: { type: Number, default: 0 },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: 'problem_test_cases' },
);

problemTestCaseSchema.index({ problemId: 1, visibility: 1, order: 1, deletedAt: 1 });

export type ProblemTestCaseDocument = InferSchemaType<typeof problemTestCaseSchema> & {
  _id: Types.ObjectId;
};

export const ProblemTestCaseModel = model('ProblemTestCase', problemTestCaseSchema);
