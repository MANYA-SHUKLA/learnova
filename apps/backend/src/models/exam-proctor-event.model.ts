import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { PROCTOR_EVENT_TYPES } from '@learnova/constants';

export { PROCTOR_EVENT_TYPES };

const examProctorEventSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true, index: true },
    attemptId: { type: Schema.Types.ObjectId, ref: 'ExamAttempt', required: true, index: true },
    proctorSessionId: {
      type: Schema.Types.ObjectId,
      ref: 'ExamProctorSession',
      default: null,
      index: true,
    },
    eventType: { type: String, enum: PROCTOR_EVENT_TYPES, required: true, index: true },
    severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'info' },
    message: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'exam_proctor_events' },
);

examProctorEventSchema.index({ institutionId: 1, attemptId: 1, createdAt: -1 });

export type ExamProctorEventDocument = InferSchemaType<typeof examProctorEventSchema> & {
  _id: Types.ObjectId;
};

export const ExamProctorEventModel = model('ExamProctorEvent', examProctorEventSchema);
