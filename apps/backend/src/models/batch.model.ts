import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const batchSchema = new Schema(
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
    name: { type: String, required: true, trim: true },
    year: { type: Number, required: true },
    status: {
      type: String,
      enum: ['active', 'inactive', 'archived'],
      default: 'active',
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'batches' },
);

batchSchema.index({ institutionId: 1, programId: 1, year: 1 }, { unique: true });

export type BatchDocument = InferSchemaType<typeof batchSchema> & {
  _id: Types.ObjectId;
};

export const BatchModel = model('Batch', batchSchema);
