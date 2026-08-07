import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { ACCESSIBILITY_FONT_SIZES } from '@learnova/constants';

export { ACCESSIBILITY_FONT_SIZES };

const examAccessibilitySchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    extendedTimePercent: { type: Number, default: 0, min: 0, max: 200 },
    extraMinutes: { type: Number, default: 0, min: 0, max: 240 },
    fontSize: { type: String, enum: ACCESSIBILITY_FONT_SIZES, default: 'default' },
    screenReaderAllowed: { type: Boolean, default: false },
    notes: { type: String, default: null },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true, collection: 'exam_accessibility' },
);

examAccessibilitySchema.index({ institutionId: 1, examId: 1, studentId: 1 }, { unique: true });

export type ExamAccessibilityDocument = InferSchemaType<typeof examAccessibilitySchema> & {
  _id: Types.ObjectId;
};

export const ExamAccessibilityModel = model('ExamAccessibility', examAccessibilitySchema);
