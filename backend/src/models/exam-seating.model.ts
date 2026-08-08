import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const examSeatingSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    seatNumber: { type: String, required: true, trim: true, maxlength: 20 },
    room: { type: String, default: null, trim: true, maxlength: 50 },
    row: { type: String, default: null, trim: true, maxlength: 10 },
    column: { type: String, default: null, trim: true, maxlength: 10 },
    checkedInAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'exam_seating' },
);

examSeatingSchema.index({ institutionId: 1, examId: 1, studentId: 1 }, { unique: true });
examSeatingSchema.index({ institutionId: 1, examId: 1, seatNumber: 1 });

export type ExamSeatingDocument = InferSchemaType<typeof examSeatingSchema> & {
  _id: Types.ObjectId;
};

export const ExamSeatingModel = model('ExamSeating', examSeatingSchema);
