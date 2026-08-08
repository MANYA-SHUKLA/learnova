import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { CERTIFICATE_AUDIT_EVENTS } from '@learnova/constants';

const certificateAuditLogSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', default: null, index: true },
    certificateId: { type: Schema.Types.ObjectId, ref: 'AcademicCertificate', default: null },
    transcriptId: { type: Schema.Types.ObjectId, ref: 'AcademicTranscript', default: null },
    event: { type: String, enum: CERTIFICATE_AUDIT_EVENTS, required: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    payload: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'certificate_audit_logs' },
);

certificateAuditLogSchema.index({ institutionId: 1, createdAt: -1 });

export type CertificateAuditLogDocument = InferSchemaType<typeof certificateAuditLogSchema> & {
  _id: Types.ObjectId;
};

export const CertificateAuditLogModel = model('CertificateAuditLog', certificateAuditLogSchema);
