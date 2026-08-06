import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const programSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    durationYears: { type: Number, required: true },
    credits: { type: Number, required: true },
    level: {
      type: String,
      enum: ['certificate', 'diploma', 'undergraduate', 'postgraduate', 'doctoral'],
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'archived'],
      default: 'active',
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'programs' },
);

programSchema.index({ institutionId: 1, code: 1 }, { unique: true });

export type ProgramDocument = InferSchemaType<typeof programSchema> & {
  _id: Types.ObjectId;
};

export const ProgramModel = model('Program', programSchema);
