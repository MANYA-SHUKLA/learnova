import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

export type EnrollmentAuditEvent =
  | 'enrollment_created'
  | 'enrollment_updated'
  | 'enrollment_deleted'
  | 'enrollment_restored'
  | 'enrollment_approved'
  | 'enrollment_rejected'
  | 'enrollment_withdrawn'
  | 'enrollment_completed'
  | 'enrollment_dropped'
  | 'enrollment_suspended'
  | 'enrollment_faculty_assigned'
  | 'enrollment_bulk_created'
  | 'enrollment_bulk_approved'
  | 'enrollment_bulk_rejected'
  | 'enrollment_bulk_deleted'
  | 'enrollment_bulk_faculty_assigned'
  | 'enrollment_imported'
  | 'enrollment_exported'
  | 'waitlist_joined'
  | 'waitlist_left'
  | 'waitlist_promoted';

export const ENROLLMENT_AUDIT_EVENTS: EnrollmentAuditEvent[] = [
  'enrollment_created',
  'enrollment_updated',
  'enrollment_deleted',
  'enrollment_restored',
  'enrollment_approved',
  'enrollment_rejected',
  'enrollment_withdrawn',
  'enrollment_completed',
  'enrollment_dropped',
  'enrollment_suspended',
  'enrollment_faculty_assigned',
  'enrollment_bulk_created',
  'enrollment_bulk_approved',
  'enrollment_bulk_rejected',
  'enrollment_bulk_deleted',
  'enrollment_bulk_faculty_assigned',
  'enrollment_imported',
  'enrollment_exported',
  'waitlist_joined',
  'waitlist_left',
  'waitlist_promoted',
];

const enrollmentAuditLogSchema = new Schema(
  {
    event: {
      type: String,
      enum: ENROLLMENT_AUDIT_EVENTS,
      required: true,
      index: true,
    },
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    enrollmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Enrollment',
      default: null,
      index: true,
    },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', default: null, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', default: null, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    email: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: 'enrollment_audit_logs' },
);

enrollmentAuditLogSchema.index({ institutionId: 1, createdAt: -1 });
enrollmentAuditLogSchema.index({ enrollmentId: 1, createdAt: -1 });

export type EnrollmentAuditLogDocument = InferSchemaType<typeof enrollmentAuditLogSchema> & {
  _id: Types.ObjectId;
};

export const EnrollmentAuditLogModel = model('EnrollmentAuditLog', enrollmentAuditLogSchema);
