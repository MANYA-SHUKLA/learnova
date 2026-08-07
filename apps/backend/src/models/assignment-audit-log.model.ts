import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

export type AssignmentAuditEvent =
  | 'assignment_created'
  | 'assignment_updated'
  | 'assignment_deleted'
  | 'assignment_published'
  | 'assignment_archived'
  | 'assignment_closed'
  | 'submission_created'
  | 'submission_graded'
  | 'feedback_added'
  | 'attachment_uploaded';

export const ASSIGNMENT_AUDIT_EVENTS: AssignmentAuditEvent[] = [
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
];

const assignmentAuditLogSchema = new Schema(
  {
    event: {
      type: String,
      enum: ASSIGNMENT_AUDIT_EVENTS,
      required: true,
      index: true,
    },
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Assignment',
      default: null,
      index: true,
    },
    submissionId: {
      type: Schema.Types.ObjectId,
      ref: 'AssignmentSubmission',
      default: null,
      index: true,
    },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', default: null, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', default: null, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    email: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: 'assignment_audit_logs' },
);

assignmentAuditLogSchema.index({ institutionId: 1, createdAt: -1 });
assignmentAuditLogSchema.index({ assignmentId: 1, createdAt: -1 });

export type AssignmentAuditLogDocument = InferSchemaType<typeof assignmentAuditLogSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const AssignmentAuditLogModel = model('AssignmentAuditLog', assignmentAuditLogSchema);
