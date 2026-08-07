import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { EXAM_ATTEMPT_STATUSES } from '@learnova/constants';

export { EXAM_ATTEMPT_STATUSES };

const examAttemptSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    attemptNumber: { type: Number, required: true, min: 1 },
    scheduledAt: { type: Date, default: null },
    checkedInAt: { type: Date, default: null },
    startedAt: { type: Date, default: null },
    submittedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: EXAM_ATTEMPT_STATUSES,
      default: 'scheduled',
      index: true,
    },
    score: { type: Number, default: 0, min: 0 },
    percentage: { type: Number, default: 0, min: 0, max: 100 },
    timeTakenSeconds: { type: Number, default: 0, min: 0 },
    autoSubmitted: { type: Boolean, default: false },
    proctorSessionId: { type: Schema.Types.ObjectId, ref: 'ExamProctorSession', default: null },
    violationCount: { type: Number, default: 0, min: 0 },
    terminatedReason: { type: String, default: null },
    examVersionId: { type: Schema.Types.ObjectId, ref: 'ExamVersion', default: null, index: true },
    selectedQuestionIds: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
    sessionToken: { type: String, default: null, index: true },
    lastSeenAt: { type: Date, default: null },
    disconnectedAt: { type: Date, default: null },
    resumedAt: { type: Date, default: null },
    reconnectCount: { type: Number, default: 0, min: 0 },
    extendedDurationMinutes: { type: Number, default: 0, min: 0 },
    accessibilityFontSize: { type: String, default: 'default' },
  },
  { timestamps: true, collection: 'exam_attempts' },
);

examAttemptSchema.index({ institutionId: 1, examId: 1, studentId: 1, attemptNumber: 1 });
examAttemptSchema.index({ institutionId: 1, studentId: 1, status: 1 });

export type ExamAttemptDocument = InferSchemaType<typeof examAttemptSchema> & {
  _id: Types.ObjectId;
};

export const ExamAttemptModel = model('ExamAttempt', examAttemptSchema);
