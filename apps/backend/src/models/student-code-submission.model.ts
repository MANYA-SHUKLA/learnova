import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import {
  EXECUTION_STATUSES,
  PRACTICE_LANGUAGES,
  SUBMISSION_VERDICTS,
  TEST_CASE_VISIBILITIES,
} from '@learnova/constants';

const testCaseResultSchema = new Schema(
  {
    testCaseId: { type: Schema.Types.ObjectId, ref: 'ProblemTestCase', required: true },
    visibility: { type: String, enum: TEST_CASE_VISIBILITIES, required: true },
    status: { type: String, enum: EXECUTION_STATUSES, required: true },
    stdout: { type: String, default: null },
    stderr: { type: String, default: null },
    expectedOutput: { type: String, default: null },
    executionTimeMS: { type: Number, default: null },
    memoryKB: { type: Number, default: null },
    weight: { type: Number, default: 1 },
    passed: { type: Boolean, default: false },
  },
  { _id: false },
);

const studentCodeSubmissionSchema = new Schema(
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
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    language: { type: String, enum: PRACTICE_LANGUAGES, required: true, index: true },
    sourceCode: { type: String, required: true },
    verdict: {
      type: String,
      enum: SUBMISSION_VERDICTS,
      default: 'pending',
      index: true,
    },
    score: { type: Number, default: 0, min: 0 },
    maxScore: { type: Number, default: 0, min: 0 },
    passedCount: { type: Number, default: 0, min: 0 },
    totalCount: { type: Number, default: 0, min: 0 },
    attemptNumber: { type: Number, default: 1, min: 1 },
    executionTimeMS: { type: Number, default: null },
    memoryKB: { type: Number, default: null },
    compileOutput: { type: String, default: null },
    results: { type: [testCaseResultSchema], default: [] },
    judge0Token: { type: String, default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: 'student_code_submissions' },
);

studentCodeSubmissionSchema.index({ studentId: 1, problemId: 1, createdAt: -1 });
studentCodeSubmissionSchema.index({ practiceLabId: 1, verdict: 1, createdAt: -1 });
studentCodeSubmissionSchema.index({ institutionId: 1, createdAt: -1 });

export type StudentCodeSubmissionDocument = InferSchemaType<
  typeof studentCodeSubmissionSchema
> & {
  _id: Types.ObjectId;
};

export const StudentCodeSubmissionModel = model(
  'StudentCodeSubmission',
  studentCodeSubmissionSchema,
);
