import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { QUIZ_AUDIT_EVENTS } from '@learnova/constants';

export { QUIZ_AUDIT_EVENTS };
export type QuizAuditEvent = (typeof QUIZ_AUDIT_EVENTS)[number];

const quizAuditLogSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    quizId: { type: Schema.Types.ObjectId, ref: 'Quiz', default: null, index: true },
    questionId: { type: Schema.Types.ObjectId, ref: 'Question', default: null, index: true },
    attemptId: { type: Schema.Types.ObjectId, ref: 'QuizAttempt', default: null, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', default: null },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    email: { type: String, default: null },
    event: { type: String, enum: QUIZ_AUDIT_EVENTS, required: true, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'quiz_audit_logs' },
);

quizAuditLogSchema.index({ institutionId: 1, event: 1, createdAt: -1 });

export type QuizAuditLogDocument = InferSchemaType<typeof quizAuditLogSchema> & {
  _id: Types.ObjectId;
};

export const QuizAuditLogModel = model('QuizAuditLog', quizAuditLogSchema);
