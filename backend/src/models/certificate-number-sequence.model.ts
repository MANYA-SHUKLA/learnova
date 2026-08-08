import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const certificateNumberSequenceSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    year: { type: Number, required: true, index: true },
    prefix: { type: String, default: 'LNV', trim: true },
    segment: { type: String, default: 'CERT', trim: true },
    sequence: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, collection: 'certificate_number_sequences' },
);

certificateNumberSequenceSchema.index({ institutionId: 1, year: 1, prefix: 1 }, { unique: true });

export type CertificateNumberSequenceDocument = InferSchemaType<
  typeof certificateNumberSequenceSchema
> & {
  _id: Types.ObjectId;
};

export const CertificateNumberSequenceModel = model(
  'CertificateNumberSequence',
  certificateNumberSequenceSchema,
);
