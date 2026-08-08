import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const cgpaRecordSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    programId: { type: Schema.Types.ObjectId, ref: 'Program', default: null, index: true },
    cgpa: { type: Number, default: null, min: 0, max: 4 },
    totalCredits: { type: Number, default: 0, min: 0 },
    completedCredits: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, collection: 'cgpa_records' },
);

cgpaRecordSchema.index({ institutionId: 1, studentId: 1, programId: 1 }, { unique: true });

export type CGPARecordDocument = InferSchemaType<typeof cgpaRecordSchema> & {
  _id: Types.ObjectId;
};

export const CGPARecordModel = model('CGPARecord', cgpaRecordSchema);
