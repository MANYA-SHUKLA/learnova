import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const projectAttachmentSchema = new Schema(
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
      default: null,
      index: true,
    },
    submissionId: {
      type: Schema.Types.ObjectId,
      ref: 'ProjectSubmission',
      default: null,
      index: true,
    },
    commentId: {
      type: Schema.Types.ObjectId,
      ref: 'ProjectComment',
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
  { timestamps: true, collection: 'project_attachments' },
);

export type ProjectAttachmentDocument = InferSchemaType<typeof projectAttachmentSchema> & {
  _id: Types.ObjectId;
};

export const ProjectAttachmentModel = model('ProjectAttachment', projectAttachmentSchema);
