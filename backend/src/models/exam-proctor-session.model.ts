import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const examProctorSessionSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true, index: true },
    attemptId: { type: Schema.Types.ObjectId, ref: 'ExamAttempt', required: true, index: true },
    proctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    startedAt: { type: Date, required: true, default: Date.now },
    endedAt: { type: Date, default: null },
    status: { type: String, enum: ['active', 'closed'], default: 'active', index: true },
    notes: { type: String, default: null },
  },
  { timestamps: true, collection: 'exam_proctor_sessions' },
);

examProctorSessionSchema.index({ institutionId: 1, examId: 1, status: 1 });

export type ExamProctorSessionDocument = InferSchemaType<typeof examProctorSessionSchema> & {
  _id: Types.ObjectId;
};

export const ExamProctorSessionModel = model('ExamProctorSession', examProctorSessionSchema);
