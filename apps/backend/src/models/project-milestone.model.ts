import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { PROJECT_MILESTONE_STATUSES } from '@learnova/constants';

export { PROJECT_MILESTONE_STATUSES };

const projectMilestoneSchema = new Schema(
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
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: null },
    dueDate: { type: Date, default: null, index: true },
    order: { type: Number, default: 0, min: 0 },
    weight: { type: Number, default: 0, min: 0, max: 100 },
    status: {
      type: String,
      enum: PROJECT_MILESTONE_STATUSES,
      default: 'pending',
      index: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: 'project_milestones' },
);

projectMilestoneSchema.index({ projectId: 1, order: 1, deletedAt: 1 });
projectMilestoneSchema.index({ institutionId: 1, projectId: 1, status: 1, deletedAt: 1 });

export type ProjectMilestoneDocument = InferSchemaType<typeof projectMilestoneSchema> & {
  _id: Types.ObjectId;
};

export const ProjectMilestoneModel = model('ProjectMilestone', projectMilestoneSchema);
