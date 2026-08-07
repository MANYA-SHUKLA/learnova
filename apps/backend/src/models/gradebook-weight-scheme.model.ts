import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { GRADEBOOK_ATTEMPT_POLICIES, GRADEBOOK_DEFAULTS } from '@learnova/constants';

const gradebookWeightSchemeSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      unique: true,
      index: true,
    },
    assignmentWeight: {
      type: Number,
      default: GRADEBOOK_DEFAULTS.ASSIGNMENT_WEIGHT,
      min: 0,
      max: 100,
    },
    labWeight: {
      type: Number,
      default: GRADEBOOK_DEFAULTS.LAB_WEIGHT,
      min: 0,
      max: 100,
    },
    quizWeight: {
      type: Number,
      default: GRADEBOOK_DEFAULTS.QUIZ_WEIGHT,
      min: 0,
      max: 100,
    },
    examWeight: {
      type: Number,
      default: GRADEBOOK_DEFAULTS.EXAM_WEIGHT,
      min: 0,
      max: 100,
    },
    projectWeight: {
      type: Number,
      default: GRADEBOOK_DEFAULTS.PROJECT_WEIGHT,
      min: 0,
      max: 100,
    },
    attemptPolicy: {
      type: String,
      enum: GRADEBOOK_ATTEMPT_POLICIES,
      default: GRADEBOOK_DEFAULTS.ATTEMPT_POLICY,
    },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true, collection: 'gradebook_weight_schemes' },
);

export type GradebookWeightSchemeDocument = InferSchemaType<typeof gradebookWeightSchemeSchema> & {
  _id: Types.ObjectId;
};

export const GradebookWeightSchemeModel = model(
  'GradebookWeightScheme',
  gradebookWeightSchemeSchema,
);
