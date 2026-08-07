import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const examVersionSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true, index: true },
    versionNumber: { type: Number, required: true, min: 1 },
    snapshot: { type: Schema.Types.Mixed, required: true },
    publishedAt: { type: Date, required: true },
    publishedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    immutable: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'exam_versions' },
);

examVersionSchema.index({ institutionId: 1, examId: 1, versionNumber: 1 }, { unique: true });

export type ExamVersionDocument = InferSchemaType<typeof examVersionSchema> & { _id: Types.ObjectId };

export const ExamVersionModel = model('ExamVersion', examVersionSchema);
