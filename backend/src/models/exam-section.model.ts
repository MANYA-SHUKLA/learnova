import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const examSectionSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: null },
    marks: { type: Number, default: 0, min: 0 },
    questionCount: { type: Number, default: 0, min: 0 },
    randomizeQuestions: { type: Boolean, default: false },
    randomQuestionCount: { type: Number, default: null, min: 1 },
    displayOrder: { type: Number, default: 0, min: 0 },
    questionIds: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: 'exam_sections' },
);

examSectionSchema.index({ institutionId: 1, examId: 1, displayOrder: 1, deletedAt: 1 });

export type ExamSectionDocument = InferSchemaType<typeof examSectionSchema> & {
  _id: Types.ObjectId;
};

export const ExamSectionModel = model('ExamSection', examSectionSchema);
