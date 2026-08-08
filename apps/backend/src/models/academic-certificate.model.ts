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
    documentType: { type: String, enum: CERTIFICATE_DOCUMENT_TYPES, required: true, index: true },
    templateId: { type: Schema.Types.ObjectId, ref: 'CertificateTemplate', default: null },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', default: null, index: true },
    courseGradeId: {
      type: Schema.Types.ObjectId,
      ref: 'CourseGradeSummary',
      default: null,
      index: true,
    },
    semesterId: { type: Schema.Types.ObjectId, ref: 'Semester', default: null, index: true },
    programId: { type: Schema.Types.ObjectId, ref: 'Program', default: null, index: true },
    verificationCode: { type: String, required: true, unique: true, index: true, uppercase: true },
    status: { type: String, enum: CERTIFICATE_STATUSES, default: 'issued', index: true },
    title: { type: String, required: true, trim: true },
    documentPayload: { type: Schema.Types.Mixed, required: true },
    gradebookReference: {
      courseGradeId: { type: Schema.Types.ObjectId, ref: 'CourseGradeSummary', default: null },
      snapshotVersion: { type: Number, default: null, min: 0 },
      semesterId: { type: Schema.Types.ObjectId, ref: 'Semester', default: null },
      programId: { type: Schema.Types.ObjectId, ref: 'Program', default: null },
      standingRecordId: { type: Schema.Types.ObjectId, ref: 'AcademicStanding', default: null },
    },
    issuedAt: { type: Date, default: null, index: true },
    issuedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    revokedAt: { type: Date, default: null },
    revokedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    revocationReason: { type: String, default: null, trim: true, maxlength: 2000 },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'academic_certificates' },
);

academicCertificateSchema.index(
  { institutionId: 1, studentId: 1, documentType: 1, courseId: 1, status: 1 },
  { unique: true, partialFilterExpression: { documentType: 'course_completion', status: 'issued' } },
);

export type AcademicCertificateDocument = InferSchemaType<typeof academicCertificateSchema> & {
  _id: Types.ObjectId;
};

export const AcademicCertificateModel = model('AcademicCertificate', academicCertificateSchema);
