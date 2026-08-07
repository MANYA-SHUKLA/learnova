import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const fileRefSchema = new Schema(
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
    body: { type: String, required: true, maxlength: 10000 },
    attachments: { type: [fileRefSchema], default: [] },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: 'assignment_comments' },
);

export type AssignmentCommentDocument = InferSchemaType<typeof assignmentCommentSchema> & {
  _id: Types.ObjectId;
};

export const AssignmentCommentModel = model('AssignmentComment', assignmentCommentSchema);
