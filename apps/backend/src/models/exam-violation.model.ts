import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { EXAM_AUTO_ACTIONS, EXAM_VIOLATION_TYPES } from '@learnova/constants';

export { EXAM_VIOLATION_TYPES, EXAM_AUTO_ACTIONS };

const examViolationSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true, index: true },
    attemptId: { type: Schema.Types.ObjectId, ref: 'ExamAttempt', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    violationType: { type: String, enum: EXAM_VIOLATION_TYPES, required: true, index: true },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    screenshotUrl: { type: String, default: null },
    autoAction: { type: String, enum: EXAM_AUTO_ACTIONS, default: 'record_event' },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'exam_violations' },
);

examViolationSchema.index({ institutionId: 1, examId: 1, createdAt: -1 });

export type ExamViolationDocument = InferSchemaType<typeof examViolationSchema> & {
  _id: Types.ObjectId;
};

export const ExamViolationModel = model('ExamViolation', examViolationSchema);
