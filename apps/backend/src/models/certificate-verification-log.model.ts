import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const certificateVerificationLogSchema = new Schema(
  {
    institutionId: { type: Schema.Types.ObjectId, ref: 'Institution', default: null, index: true },
    certificateId: { type: Schema.Types.ObjectId, ref: 'AcademicCertificate', default: null },
    transcriptId: { type: Schema.Types.ObjectId, ref: 'AcademicTranscript', default: null },
    verificationCode: { type: String, required: true, index: true, uppercase: true },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
    valid: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'certificate_verification_logs' },
);

certificateVerificationLogSchema.index({ createdAt: -1 });

export type CertificateVerificationLogDocument = InferSchemaType<
  typeof certificateVerificationLogSchema
> & {
  _id: Types.ObjectId;
};

export const CertificateVerificationLogModel = model(
  'CertificateVerificationLog',
  certificateVerificationLogSchema,
);
