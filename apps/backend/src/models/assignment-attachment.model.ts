import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

/**
 * Standalone attachment record. Files are also embedded on the owning
 * assignment / submission / comment for cheap reads; this collection is the
 * canonical index used for storage cleanup and per-file lookups.
 */
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
    fileRefId: { type: String, required: true, index: true },
    fileName: { type: String, required: true, trim: true },
    contentType: { type: String, required: true },
    sizeBytes: { type: Number, required: true, min: 0 },
    storageKey: { type: String, required: true, index: true },
    url: { type: String, default: null },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: 'assignment_attachments' },
);

assignmentAttachmentSchema.index({ institutionId: 1, assignmentId: 1, createdAt: -1 });
assignmentAttachmentSchema.index({ institutionId: 1, submissionId: 1, createdAt: -1 });

export type AssignmentAttachmentDocument = InferSchemaType<typeof assignmentAttachmentSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const AssignmentAttachmentModel = model(
  'AssignmentAttachment',
  assignmentAttachmentSchema,
);
