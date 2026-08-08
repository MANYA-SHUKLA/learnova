import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const academicRecordVersionSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    academicRecordId: {
      type: Schema.Types.ObjectId,
      ref: 'AcademicRecord',
      required: true,
      index: true,
    },
    version: { type: Number, required: true, min: 1 },
    snapshot: { type: Schema.Types.Mixed, required: true },
    frozenAt: { type: Date, required: true },
    frozenBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    immutable: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'academic_record_versions' },
);

academicRecordVersionSchema.index(
  { institutionId: 1, academicRecordId: 1, version: 1 },
  { unique: true },
);

export type AcademicRecordVersionDocument = InferSchemaType<
  typeof academicRecordVersionSchema
> & {
  _id: Types.ObjectId;
};

export const AcademicRecordVersionModel = model(
  'AcademicRecordVersion',
  academicRecordVersionSchema,
);
