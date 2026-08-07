import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { PRACTICE_LAB_AUDIT_EVENTS, type PracticeLabAuditEvent } from '@learnova/constants';

export { PRACTICE_LAB_AUDIT_EVENTS, type PracticeLabAuditEvent };

const practiceLabAuditLogSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    practiceLabId: {
      type: Schema.Types.ObjectId,
      ref: 'PracticeLab',
      default: null,
      index: true,
    },
    problemId: { type: Schema.Types.ObjectId, ref: 'LabProblem', default: null, index: true },
    submissionId: {
      type: Schema.Types.ObjectId,
      ref: 'StudentCodeSubmission',
      default: null,
      index: true,
    },
    executionId: {
      type: Schema.Types.ObjectId,
      ref: 'ExecutionHistory',
      default: null,
      index: true,
    },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', default: null, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', default: null, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    email: { type: String, default: null },
    event: { type: String, enum: PRACTICE_LAB_AUDIT_EVENTS, required: true, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'practice_lab_audit_logs' },
);

export type PracticeLabAuditLogDocument = InferSchemaType<typeof practiceLabAuditLogSchema> & {
  _id: Types.ObjectId;
};

export const PracticeLabAuditLogModel = model('PracticeLabAuditLog', practiceLabAuditLogSchema);
