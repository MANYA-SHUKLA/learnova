import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const projectCommentSchema = new Schema(
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
      default: null,
      index: true,
    },
    milestoneId: {
      type: Schema.Types.ObjectId,
      ref: 'ProjectMilestone',
      default: null,
      index: true,
    },
    parentCommentId: {
      type: Schema.Types.ObjectId,
      ref: 'ProjectComment',
      default: null,
      index: true,
    },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    authorRole: { type: String, required: true },
    body: { type: String, required: true, maxlength: 10000 },
    resolved: { type: Boolean, default: false, index: true },
    attachments: [{ type: Schema.Types.ObjectId, ref: 'ProjectAttachment' }],
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: 'project_comments' },
);

projectCommentSchema.index({ projectId: 1, parentCommentId: 1, deletedAt: 1 });
projectCommentSchema.index({ submissionId: 1, resolved: 1, deletedAt: 1 });

export type ProjectCommentDocument = InferSchemaType<typeof projectCommentSchema> & {
  _id: Types.ObjectId;
};

export const ProjectCommentModel = model('ProjectComment', projectCommentSchema);
