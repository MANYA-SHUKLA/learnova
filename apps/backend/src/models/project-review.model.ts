import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { PROJECT_REVIEW_STATUSES, PROJECT_REVIEW_TYPES } from '@learnova/constants';

export { PROJECT_REVIEW_TYPES, PROJECT_REVIEW_STATUSES };

const rubricScoreSchema = new Schema(
  {
    criterionId: { type: String, required: true },
    points: { type: Number, required: true, min: 0 },
    comment: { type: String, default: null },
  },
  { _id: false },
);

const projectReviewSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    submissionId: {
      type: Schema.Types.ObjectId,
      ref: 'ProjectSubmission',
      required: true,
      index: true,
    },
    reviewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reviewType: {
      type: String,
      enum: PROJECT_REVIEW_TYPES,
      default: 'peer',
      index: true,
    },
    status: {
      type: String,
      enum: PROJECT_REVIEW_STATUSES,
      default: 'draft',
      index: true,
    },
    rating: { type: Number, default: null, min: 0, max: 10 },
    feedback: { type: String, default: null },
    rubricScores: { type: [rubricScoreSchema], default: [] },
    submittedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: 'project_reviews' },
);

projectReviewSchema.index(
  { submissionId: 1, reviewerId: 1, reviewType: 1, deletedAt: 1 },
  { unique: true },
);

export type ProjectReviewDocument = InferSchemaType<typeof projectReviewSchema> & {
  _id: Types.ObjectId;
};

export const ProjectReviewModel = model('ProjectReview', projectReviewSchema);
