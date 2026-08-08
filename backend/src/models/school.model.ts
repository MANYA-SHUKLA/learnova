import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const schoolSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    description: { type: String, default: null },
    status: {
      type: String,
      enum: ['active', 'inactive', 'archived'],
      default: 'active',
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'schools' },
);

schoolSchema.index({ institutionId: 1, code: 1 }, { unique: true });

export type SchoolDocument = InferSchemaType<typeof schoolSchema> & {
  _id: Types.ObjectId;
};

export const SchoolModel = model('School', schoolSchema);
