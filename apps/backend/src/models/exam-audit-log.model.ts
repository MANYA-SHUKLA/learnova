import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { EXAM_AUDIT_EVENTS } from '@learnova/constants';

export { EXAM_AUDIT_EVENTS };
export type ExamAuditEvent = (typeof EXAM_AUDIT_EVENTS)[number];

const examAuditLogSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', default: null, index: true },
    attemptId: { type: Schema.Types.ObjectId, ref: 'ExamAttempt', default: null, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', default: null },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    email: { type: String, default: null },
    event: { type: String, enum: EXAM_AUDIT_EVENTS, required: true, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'exam_audit_logs' },
);

examAuditLogSchema.index({ institutionId: 1, event: 1, createdAt: -1 });

export type ExamAuditLogDocument = InferSchemaType<typeof examAuditLogSchema> & {
  _id: Types.ObjectId;
};

export const ExamAuditLogModel = model('ExamAuditLog', examAuditLogSchema);
