import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { assignmentFileRefSchema } from './assignment.model.js';

const assignmentCommentSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
      index: true,
    },
    submissionId: {
      type: Schema.Types.ObjectId,
      ref: 'AssignmentSubmission',
      default: null,
      index: true,
    },
    parentCommentId: {
      type: Schema.Types.ObjectId,
      ref: 'AssignmentComment',
      default: null,
      index: true,
    },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    authorRole: { type: String, required: true },
    body: { type: String, required: true },
    attachments: { type: [assignmentFileRefSchema], default: [] },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: 'assignment_comments' },
);

assignmentCommentSchema.index({ institutionId: 1, assignmentId: 1, createdAt: 1 });
assignmentCommentSchema.index({ institutionId: 1, submissionId: 1, createdAt: 1 });
assignmentCommentSchema.index({ parentCommentId: 1, createdAt: 1 });

export type AssignmentCommentDocument = InferSchemaType<typeof assignmentCommentSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const AssignmentCommentModel = model('AssignmentComment', assignmentCommentSchema);
