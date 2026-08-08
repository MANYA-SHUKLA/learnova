import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

export const ASSIGNMENT_AUDIT_EVENTS = [
  'assignment_created',
  'assignment_updated',
  'assignment_deleted',
  'assignment_published',
  'assignment_archived',
  'assignment_closed',
  'submission_created',
  'submission_graded',
  'feedback_added',
  'attachment_uploaded',
] as const;

export type AssignmentAuditEvent = (typeof ASSIGNMENT_AUDIT_EVENTS)[number];

const assignmentAuditLogSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', default: null, index: true },
    submissionId: {
      type: Schema.Types.ObjectId,
      ref: 'AssignmentSubmission',
      default: null,
      index: true,
    },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', default: null, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', default: null, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    email: { type: String, default: null },
    event: { type: String, enum: ASSIGNMENT_AUDIT_EVENTS, required: true, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'assignment_audit_logs' },
);

export type AssignmentAuditLogDocument = InferSchemaType<typeof assignmentAuditLogSchema> & {
  _id: Types.ObjectId;
};

export const AssignmentAuditLogModel = model('AssignmentAuditLog', assignmentAuditLogSchema);
