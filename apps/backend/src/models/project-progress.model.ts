import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { PROJECT_PROGRESS_STATUSES } from '@learnova/constants';

export { PROJECT_PROGRESS_STATUSES };

const projectProgressSchema = new Schema(
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
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'ProjectTeam', default: null, index: true },
    status: {
      type: String,
      enum: PROJECT_PROGRESS_STATUSES,
      default: 'not_started',
      index: true,
    },
    milestonesCompleted: { type: Number, default: 0, min: 0 },
    totalMilestones: { type: Number, default: 0, min: 0 },
    peerReviewsGiven: { type: Number, default: 0, min: 0 },
    peerReviewsRequired: { type: Number, default: 0, min: 0 },
    submissionId: { type: Schema.Types.ObjectId, ref: 'ProjectSubmission', default: null },
    gradeId: { type: Schema.Types.ObjectId, ref: 'ProjectGrade', default: null },
    lastActivityAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: 'project_progress' },
);

projectProgressSchema.index(
  { projectId: 1, studentId: 1, deletedAt: 1 },
  { unique: true },
);

export type ProjectProgressDocument = InferSchemaType<typeof projectProgressSchema> & {
  _id: Types.ObjectId;
};

export const ProjectProgressModel = model('ProjectProgress', projectProgressSchema);
