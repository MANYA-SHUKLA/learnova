import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import {
  GPA_FORMULAS,
  GRADE_REPLACEMENT_POLICIES,
  GRADEBOOK_ATTEMPT_POLICIES,
  GRADING_SCHEME_MODES,
  PASSING_CRITERIA_MODES,
} from '@learnova/constants';

const standingThresholdsSchema = new Schema(
  {
    probationGpa: { type: Number, default: 1.5, min: 0, max: 4 },
    warningGpa: { type: Number, default: 2.0, min: 0, max: 4 },
    honorsGpa: { type: Number, default: 3.5, min: 0, max: 4 },
    distinctionGpa: { type: Number, default: 3.8, min: 0, max: 4 },
    failedCourseLimit: { type: Number, default: 2, min: 0 },
  },
  { _id: false },
);

const gradebookAcademicPolicySchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      unique: true,
      index: true,
    },
    creditBasedGrading: { type: Boolean, default: true },
    passingCriteria: { type: String, enum: PASSING_CRITERIA_MODES, default: 'both' },
    passingPercentage: { type: Number, default: 60, min: 0, max: 100 },
    passingGradeLetters: { type: [String], default: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-'] },
    gradingScheme: { type: String, enum: GRADING_SCHEME_MODES, default: 'absolute' },
    gpaFormula: { type: String, enum: GPA_FORMULAS, default: 'credit_weighted' },
    cgpaFormula: { type: String, enum: GPA_FORMULAS, default: 'credit_weighted' },
    gradeReplacementPolicy: {
      type: String,
      enum: GRADE_REPLACEMENT_POLICIES,
      default: 'replace_if_higher',
    },
    makeupAttemptPolicy: { type: String, enum: GRADEBOOK_ATTEMPT_POLICIES, default: 'best' },
    improvementAttemptPolicy: { type: String, enum: GRADEBOOK_ATTEMPT_POLICIES, default: 'best' },
    improvementExamTypes: { type: [String], default: [] },
    standingThresholds: { type: standingThresholdsSchema, default: () => ({}) },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true, collection: 'gradebook_academic_policies' },
);

export type GradebookAcademicPolicyDocument = InferSchemaType<
  typeof gradebookAcademicPolicySchema
> & {
  _id: Types.ObjectId;
};

export const GradebookAcademicPolicyModel = model(
  'GradebookAcademicPolicy',
  gradebookAcademicPolicySchema,
);
