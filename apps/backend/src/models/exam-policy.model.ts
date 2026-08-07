import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { PROCTORING_MODES, SECURE_BROWSER_POLICIES } from '@learnova/constants';

const examPolicySchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: null },
    attemptLimit: { type: Number, default: 1, min: 1, max: 5 },
    negativeMarking: { type: Boolean, default: false },
    negativeMarkValue: { type: Number, default: 0.25, min: 0 },
    shuffleQuestions: { type: Boolean, default: true },
    shuffleOptions: { type: Boolean, default: true },
    allowBacktracking: { type: Boolean, default: true },
    calculatorAllowed: { type: Boolean, default: false },
    proctoringMode: { type: String, enum: PROCTORING_MODES, default: 'none' },
    secureBrowser: { type: String, enum: SECURE_BROWSER_POLICIES, default: 'recommended' },
    requireFullscreen: { type: Boolean, default: true },
    blockCopyPaste: { type: Boolean, default: true },
    blockRightClick: { type: Boolean, default: true },
    blockNewTabs: { type: Boolean, default: true },
    maxTabSwitches: { type: Number, default: 3, min: 0 },
    autoTerminateOnViolation: { type: Boolean, default: false },
    requireWebcam: { type: Boolean, default: false },
    requireMicrophone: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: 'exam_policies' },
);

examPolicySchema.index({ institutionId: 1, name: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });

export type ExamPolicyDocument = InferSchemaType<typeof examPolicySchema> & { _id: Types.ObjectId };

export const ExamPolicyModel = model('ExamPolicy', examPolicySchema);
