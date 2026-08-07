import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import {
  PROJECT_DELIVERY_TYPES,
  PROJECT_SUBMISSION_STATUSES,
} from '@learnova/constants';
import { projectFileRefSchema } from './project.model.js';

export { PROJECT_SUBMISSION_STATUSES, PROJECT_DELIVERY_TYPES };

const projectSubmissionSchema = new Schema(
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
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', default: null, index: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'ProjectTeam', default: null, index: true },
    milestoneId: {
      type: Schema.Types.ObjectId,
      ref: 'ProjectMilestone',
      default: null,
      index: true,
    },
    attemptNumber: { type: Number, required: true, min: 1, default: 1 },
    submittedAt: { type: Date, default: null, index: true },
    status: {
      type: String,
      enum: PROJECT_SUBMISSION_STATUSES,
      default: 'draft',
      index: true,
    },
    deliveryType: {
      type: String,
      enum: PROJECT_DELIVERY_TYPES,
      default: 'mixed',
    },
    files: { type: [projectFileRefSchema], default: [] },
    textSubmission: { type: String, default: null },
    links: { type: [String], default: [] },
    repoLink: { type: String, default: null },
    timeSpentMinutes: { type: Number, default: null },
    lateSubmission: { type: Boolean, default: false, index: true },
    gradeId: { type: Schema.Types.ObjectId, ref: 'ProjectGrade', default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: 'project_submissions' },
);

projectSubmissionSchema.index(
  { projectId: 1, studentId: 1, milestoneId: 1, attemptNumber: 1, deletedAt: 1 },
  { partialFilterExpression: { studentId: { $type: 'objectId' } } },
);
projectSubmissionSchema.index(
  { projectId: 1, teamId: 1, milestoneId: 1, attemptNumber: 1, deletedAt: 1 },
  { partialFilterExpression: { teamId: { $type: 'objectId' } } },
);
projectSubmissionSchema.index({ institutionId: 1, status: 1, deletedAt: 1 });

export type ProjectSubmissionDocument = InferSchemaType<typeof projectSubmissionSchema> & {
  _id: Types.ObjectId;
};

export const ProjectSubmissionModel = model('ProjectSubmission', projectSubmissionSchema);
