import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const assignmentAttachmentSchema = new Schema(
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
    commentId: {
      type: Schema.Types.ObjectId,
      ref: 'AssignmentComment',
      default: null,
      index: true,
    },
    fileName: { type: String, required: true, trim: true },
    contentType: { type: String, required: true },
    sizeBytes: { type: Number, required: true, min: 0 },
    storageKey: { type: String, required: true },
    url: { type: String, default: null },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: 'assignment_attachments' },
);

export type AssignmentAttachmentDocument = InferSchemaType<typeof assignmentAttachmentSchema> & {
  _id: Types.ObjectId;
};

export const AssignmentAttachmentModel = model(
  'AssignmentAttachment',
  assignmentAttachmentSchema,
);
