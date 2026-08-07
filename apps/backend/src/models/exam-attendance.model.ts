import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { EXAM_ATTENDANCE_STATUSES } from '@learnova/constants';

export { EXAM_ATTENDANCE_STATUSES };

const examAttendanceSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    attemptId: { type: Schema.Types.ObjectId, ref: 'ExamAttempt', default: null },
    roomId: { type: Schema.Types.ObjectId, ref: 'ExamRoom', default: null },
    status: { type: String, enum: EXAM_ATTENDANCE_STATUSES, default: 'absent', index: true },
    checkedInAt: { type: Date, default: null },
    autoRecorded: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'exam_attendance' },
);

examAttendanceSchema.index({ institutionId: 1, examId: 1, studentId: 1 }, { unique: true });

export type ExamAttendanceDocument = InferSchemaType<typeof examAttendanceSchema> & {
  _id: Types.ObjectId;
};

export const ExamAttendanceModel = model('ExamAttendance', examAttendanceSchema);
