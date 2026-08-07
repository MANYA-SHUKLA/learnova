import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import {
  PROJECT_STATUSES,
  PROJECT_TYPES,
  PROJECT_VISIBILITIES,
} from '@learnova/constants';

export { PROJECT_TYPES, PROJECT_STATUSES, PROJECT_VISIBILITIES };

export const projectFileRefSchema = new Schema(
  {
    id: { type: String, required: true },
    fileName: { type: String, required: true, trim: true },
    contentType: { type: String, required: true },
    sizeBytes: { type: Number, required: true, min: 0 },
    storageKey: { type: String, required: true },
    url: { type: String, default: null },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const projectSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    moduleId: { type: Schema.Types.ObjectId, ref: 'CourseModule', default: null, index: true },
    lessonId: { type: Schema.Types.ObjectId, ref: 'CourseLesson', default: null, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200, index: true },
    description: { type: String, default: null },
    instructions: { type: String, default: null },
    projectType: {
      type: String,
      enum: PROJECT_TYPES,
      default: 'team',
      index: true,
    },
    teamSizeMin: { type: Number, default: 1, min: 1 },
    teamSizeMax: { type: Number, default: 6, min: 1 },
    allowSelfTeamFormation: { type: Boolean, default: true },
    allowPeerReview: { type: Boolean, default: false },
    peerReviewsRequired: { type: Number, default: 0, min: 0 },
    allowRepoLink: { type: Boolean, default: true },
    allowMilestones: { type: Boolean, default: true },
    visibility: {
      type: String,
      enum: PROJECT_VISIBILITIES,
      default: 'enrolled',
      index: true,
    },
    status: {
      type: String,
      enum: PROJECT_STATUSES,
      default: 'draft',
      index: true,
    },
    totalMarks: { type: Number, default: 100, min: 0 },
    passingMarks: { type: Number, default: 40, min: 0 },
    weightage: { type: Number, default: 0, min: 0, max: 100 },
    allowLateSubmission: { type: Boolean, default: true },
    latePenaltyPercent: { type: Number, default: 0, min: 0, max: 100 },
    allowResubmission: { type: Boolean, default: false },
    maxAttempts: { type: Number, default: 1, min: 1, max: 20 },
    publishDate: { type: Date, default: null, index: true },
    dueDate: { type: Date, default: null, index: true },
    closeDate: { type: Date, default: null, index: true },
    estimatedMinutes: { type: Number, default: null },
    attachments: { type: [projectFileRefSchema], default: [] },
    rubricId: { type: Schema.Types.ObjectId, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: 'projects' },
);

projectSchema.index({ institutionId: 1, courseId: 1, status: 1, deletedAt: 1 });
projectSchema.index({ institutionId: 1, title: 'text', description: 'text' });

export type ProjectDocument = InferSchemaType<typeof projectSchema> & {
  _id: Types.ObjectId;
};

export const ProjectModel = model('Project', projectSchema);
