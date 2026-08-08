import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { QUESTION_DIFFICULTIES, QUESTION_TYPES } from '@learnova/constants';

export { QUESTION_TYPES, QUESTION_DIFFICULTIES };

export const questionAttachmentSchema = new Schema(
  {
    id: { type: String, required: true },
    fileName: { type: String, required: true, trim: true },
    contentType: { type: String, required: true },
    sizeBytes: { type: Number, required: true, min: 0 },
    storageKey: { type: String, required: true },
    url: { type: String, default: null },
  },
  { _id: false },
);

export const questionOptionSchema = new Schema(
  {
    id: { type: String, required: true },
    optionText: { type: String, required: true, trim: true, maxlength: 2000 },
    isCorrect: { type: Boolean, default: false },
    displayOrder: { type: Number, default: 0, min: 0 },
    feedback: { type: String, default: null },
  },
  { _id: false },
);

export const matchPairSchema = new Schema(
  {
    id: { type: String, required: true },
    left: { type: String, required: true, trim: true, maxlength: 500 },
    right: { type: String, required: true, trim: true, maxlength: 500 },
    displayOrder: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

export const questionExplanationSchema = new Schema(
  {
    text: { type: String, default: null },
    mediaUrl: { type: String, default: null },
  },
  { _id: false },
);

const questionSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    questionBankId: {
      type: Schema.Types.ObjectId,
      ref: 'QuestionBank',
      required: true,
      index: true,
    },
    question: { type: String, required: true, trim: true, maxlength: 10000, index: true },
    description: { type: String, default: null },
    questionType: {
      type: String,
      enum: QUESTION_TYPES,
      required: true,
      index: true,
    },
    difficulty: {
      type: String,
      enum: QUESTION_DIFFICULTIES,
      default: 'medium',
      index: true,
    },
    marks: { type: Number, default: 1, min: 0 },
    negativeMarks: { type: Number, default: 0, min: 0 },
    explanation: { type: questionExplanationSchema, default: null },
    hint: { type: String, default: null },
    tags: { type: [String], default: [] },
    category: { type: String, default: null, index: true },
    attachments: { type: [questionAttachmentSchema], default: [] },
    options: { type: [questionOptionSchema], default: [] },
    matchPairs: { type: [matchPairSchema], default: [] },
    fillBlankAnswers: { type: [String], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: 'questions' },
);

questionSchema.index({ institutionId: 1, questionBankId: 1, deletedAt: 1 });
questionSchema.index({ institutionId: 1, question: 'text', description: 'text' });

export type QuestionDocument = InferSchemaType<typeof questionSchema> & { _id: Types.ObjectId };

export const QuestionModel = model('Question', questionSchema);
