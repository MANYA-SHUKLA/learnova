import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const sectionSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    programId: {
      type: Schema.Types.ObjectId,
      ref: 'Program',
      required: true,
      index: true,
    },
    semesterId: {
      type: Schema.Types.ObjectId,
      ref: 'Semester',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    capacity: { type: Number, required: true },
    status: {
      type: String,
      enum: ['active', 'inactive', 'archived'],
      default: 'active',
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'sections' },
);

sectionSchema.index(
  { institutionId: 1, programId: 1, semesterId: 1, name: 1 },
  { unique: true },
);

export type SectionDocument = InferSchemaType<typeof sectionSchema> & {
  _id: Types.ObjectId;
};

export const SectionModel = model('Section', sectionSchema);
