import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const studentAuditEvents = [
  'student.created',
  'student.updated',
  'student.archived',
  'student.restored',
  'student.deleted',
  'student.import.started',
  'student.import.completed',
  'student.imported',
  'student.export',
  'student.exported',
  'student.profile.updated',
  'student.status.changed',
] as const;

const studentAuditLogSchema = new Schema(
  {
    event: {
      type: String,
      required: true,
      index: true,
      enum: studentAuditEvents,
    },
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      default: null,
      index: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    email: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'student_audit_logs' },
);

export type StudentAuditEvent = (typeof studentAuditEvents)[number];

export type StudentAuditLogDocument = InferSchemaType<typeof studentAuditLogSchema> & {
  _id: Types.ObjectId;
};

export const StudentAuditLogModel = model('StudentAuditLog', studentAuditLogSchema);
