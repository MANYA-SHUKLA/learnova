import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const entityIdSequenceSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    /** STU, ADM, FAC, FC, CRS */
    segment: { type: String, required: true, trim: true, uppercase: true },
    /** Year for yearly sequences; null for rolling counters */
    year: { type: Number, default: null },
    sequence: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, collection: 'entity_id_sequences' },
);

entityIdSequenceSchema.index({ institutionId: 1, segment: 1, year: 1 }, { unique: true });

export type EntityIdSequenceDocument = InferSchemaType<typeof entityIdSequenceSchema> & {
  _id: Types.ObjectId;
};

export const EntityIdSequenceModel = model('EntityIdSequence', entityIdSequenceSchema);
