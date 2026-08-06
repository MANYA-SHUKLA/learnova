import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const facultyAuditEvents = [
  'faculty.created',
  'faculty.updated',
  'faculty.archived',
  'faculty.restored',
  'faculty.deleted',
  'faculty.import.started',
  'faculty.import.completed',
  'faculty.imported',
  'faculty.export',
  'faculty.exported',
  'faculty.profile.updated',
  'faculty.status.changed',
] as const;

const facultyAuditLogSchema = new Schema(
  {
    event: {
      type: String,
      required: true,
      index: true,
      enum: facultyAuditEvents,
    },
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    facultyId: {
      type: Schema.Types.ObjectId,
      ref: 'Faculty',
      default: null,
      index: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    email: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'faculty_audit_logs' },
);

export type FacultyAuditEvent = (typeof facultyAuditEvents)[number];

export type FacultyAuditLogDocument = InferSchemaType<typeof facultyAuditLogSchema> & {
  _id: Types.ObjectId;
};

export const FacultyAuditLogModel = model('FacultyAuditLog', facultyAuditLogSchema);
