import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { EXAM_INCIDENT_TYPES } from '@learnova/constants';

export { EXAM_INCIDENT_TYPES };

const examIncidentSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true, index: true },
    attemptId: { type: Schema.Types.ObjectId, ref: 'ExamAttempt', default: null, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    incidentType: { type: String, enum: EXAM_INCIDENT_TYPES, required: true, index: true },
    severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'info' },
    message: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'exam_incidents' },
);

examIncidentSchema.index({ institutionId: 1, examId: 1, createdAt: -1 });
examIncidentSchema.index({ institutionId: 1, attemptId: 1, createdAt: -1 });

export type ExamIncidentDocument = InferSchemaType<typeof examIncidentSchema> & { _id: Types.ObjectId };

export const ExamIncidentModel = model('ExamIncident', examIncidentSchema);
