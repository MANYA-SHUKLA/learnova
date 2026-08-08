import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { EXAM_TYPES, EXAM_VISIBILITIES, PROCTORING_MODES, SECURE_BROWSER_POLICIES } from '@learnova/constants';

const templateSectionSchema = new Schema(
  {
    title: { type: String, required: true },
    marks: { type: Number, default: 0 },
    randomizeQuestions: { type: Boolean, default: true },
    randomQuestionCount: { type: Number, default: null },
    displayOrder: { type: Number, default: 0 },
  },
  { _id: false },
);

const examTemplateSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: null },
    examType: { type: String, enum: EXAM_TYPES, default: 'internal' },
    visibility: { type: String, enum: EXAM_VISIBILITIES, default: 'enrolled' },
    durationMinutes: { type: Number, default: 120, min: 1 },
    totalMarks: { type: Number, default: 100, min: 0 },
    passingMarks: { type: Number, default: 40, min: 0 },
    attemptLimit: { type: Number, default: 1, min: 1, max: 5 },
    negativeMarking: { type: Boolean, default: false },
    proctoringMode: { type: String, enum: PROCTORING_MODES, default: 'none' },
    secureBrowser: { type: String, enum: SECURE_BROWSER_POLICIES, default: 'recommended' },
    requireWebcam: { type: Boolean, default: false },
    requireMicrophone: { type: Boolean, default: false },
    shuffleQuestions: { type: Boolean, default: true },
    shuffleOptions: { type: Boolean, default: true },
    reconnectionGraceMinutes: { type: Number, default: 5, min: 0, max: 60 },
    sections: { type: [templateSectionSchema], default: [] },
    policyId: { type: Schema.Types.ObjectId, ref: 'ExamPolicy', default: null },
    blueprintId: { type: Schema.Types.ObjectId, ref: 'ExamBlueprint', default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: 'exam_templates' },
);

examTemplateSchema.index({ institutionId: 1, name: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });

export type ExamTemplateDocument = InferSchemaType<typeof examTemplateSchema> & { _id: Types.ObjectId };

export const ExamTemplateModel = model('ExamTemplate', examTemplateSchema);
