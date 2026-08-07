import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { PROJECT_AUDIT_EVENTS } from '@learnova/constants';

export { PROJECT_AUDIT_EVENTS };
export type ProjectAuditEvent = (typeof PROJECT_AUDIT_EVENTS)[number];

const projectAuditLogSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', default: null, index: true },
    submissionId: {
      type: Schema.Types.ObjectId,
      ref: 'ProjectSubmission',
      default: null,
      index: true,
    },
    teamId: { type: Schema.Types.ObjectId, ref: 'ProjectTeam', default: null, index: true },
    milestoneId: {
      type: Schema.Types.ObjectId,
      ref: 'ProjectMilestone',
      default: null,
      index: true,
    },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', default: null, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', default: null, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    email: { type: String, default: null },
    event: { type: String, enum: PROJECT_AUDIT_EVENTS, required: true, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'project_audit_logs' },
);

export type ProjectAuditLogDocument = InferSchemaType<typeof projectAuditLogSchema> & {
  _id: Types.ObjectId;
};

export const ProjectAuditLogModel = model('ProjectAuditLog', projectAuditLogSchema);
