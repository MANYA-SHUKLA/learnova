import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { CERTIFICATE_SIGNATURE_ROLES } from '@learnova/constants';

const certificateSignatureSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    certificateId: {
      type: Schema.Types.ObjectId,
      ref: 'AcademicCertificate',
      required: true,
      index: true,
    },
    role: { type: String, enum: CERTIFICATE_SIGNATURE_ROLES, required: true },
    name: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    imageUrl: { type: String, default: null },
    signedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: 'certificate_signatures' },
);

export type CertificateSignatureDocument = InferSchemaType<typeof certificateSignatureSchema> & {
  _id: Types.ObjectId;
};

export const CertificateSignatureModel = model('CertificateSignature', certificateSignatureSchema);
