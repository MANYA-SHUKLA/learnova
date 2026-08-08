import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { GRADEBOOK_AUDIT_EVENTS } from '@learnova/constants';

const gradebookAuditLogSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', default: null, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', default: null, index: true },
    event: { type: String, enum: GRADEBOOK_AUDIT_EVENTS, required: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    payload: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: 'gradebook_audit_logs' },
);

export type GradebookAuditLogDocument = InferSchemaType<typeof gradebookAuditLogSchema> & {
  _id: Types.ObjectId;
};

export const GradebookAuditLogModel = model('GradebookAuditLog', gradebookAuditLogSchema);
