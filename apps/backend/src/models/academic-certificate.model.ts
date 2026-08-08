import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { CERTIFICATE_DOCUMENT_TYPES, CERTIFICATE_STATUSES } from '@learnova/constants';

const academicCertificateSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    certificateNumber: { type: String, required: true, unique: true, index: true, trim: true },
    documentType: { type: String, enum: CERTIFICATE_DOCUMENT_TYPES, required: true, index: true },
    templateId: { type: Schema.Types.ObjectId, ref: 'CertificateTemplate', default: null },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', default: null, index: true },
    courseGradeId: {
      type: Schema.Types.ObjectId,
      ref: 'CourseGradeSummary',
      default: null,
      index: true,
    },
    activityId: { type: Schema.Types.ObjectId, default: null, index: true },
    activityKind: { type: String, default: null, trim: true },
    semesterId: { type: Schema.Types.ObjectId, ref: 'Semester', default: null, index: true },
    programId: { type: Schema.Types.ObjectId, ref: 'Program', default: null, index: true },
    verificationCode: { type: String, required: true, unique: true, index: true, uppercase: true },
    verificationURL: { type: String, required: true, trim: true },
    status: { type: String, enum: CERTIFICATE_STATUSES, default: 'issued', index: true },
    revoked: { type: Boolean, default: false, index: true },
    title: { type: String, required: true, trim: true },
    version: { type: Number, default: 1, min: 1, index: true },
    rootCertificateId: { type: Schema.Types.ObjectId, ref: 'AcademicCertificate', default: null },
    documentPayload: { type: Schema.Types.Mixed, required: true },
    gradebookReference: {
      courseGradeId: { type: Schema.Types.ObjectId, ref: 'CourseGradeSummary', default: null },
      snapshotVersion: { type: Number, default: null, min: 0 },
      semesterId: { type: Schema.Types.ObjectId, ref: 'Semester', default: null },
      programId: { type: Schema.Types.ObjectId, ref: 'Program', default: null },
      standingRecordId: { type: Schema.Types.ObjectId, ref: 'AcademicStanding', default: null },
      activityId: { type: Schema.Types.ObjectId, default: null },
      activityKind: { type: String, default: null },
    },
    issueDate: { type: Date, default: null, index: true },
    issuedAt: { type: Date, default: null, index: true },
    issuedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    publishedAt: { type: Date, default: null },
    revokedAt: { type: Date, default: null },
    revokedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    revocationReason: { type: String, default: null, trim: true, maxlength: 2000 },
    archivedAt: { type: Date, default: null },
    downloadCount: { type: Number, default: 0, min: 0 },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'academic_certificates' },
);

academicCertificateSchema.index({ institutionId: 1, studentId: 1, documentType: 1, courseId: 1, version: -1 });
academicCertificateSchema.index({ institutionId: 1, certificateNumber: 1 });

export type AcademicCertificateDocument = InferSchemaType<typeof academicCertificateSchema> & {
  _id: Types.ObjectId;
};

export const AcademicCertificateModel = model('AcademicCertificate', academicCertificateSchema);
