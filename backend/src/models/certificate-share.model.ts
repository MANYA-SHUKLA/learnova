import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { CERTIFICATE_SHARE_TYPES } from '@learnova/constants';

const certificateShareSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    certificateId: { type: Schema.Types.ObjectId, ref: 'AcademicCertificate', default: null },
    transcriptId: { type: Schema.Types.ObjectId, ref: 'AcademicTranscript', default: null },
    shareType: { type: String, enum: CERTIFICATE_SHARE_TYPES, required: true },
    token: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true, collection: 'certificate_shares' },
);

export type CertificateShareDocument = InferSchemaType<typeof certificateShareSchema> & {
  _id: Types.ObjectId;
};

export const CertificateShareModel = model('CertificateShare', certificateShareSchema);
