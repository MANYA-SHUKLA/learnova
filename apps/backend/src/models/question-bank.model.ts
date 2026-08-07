import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { QUESTION_BANK_STATUSES } from '@learnova/constants';

export { QUESTION_BANK_STATUSES };

const questionBankSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200, index: true },
    slug: { type: String, required: true, trim: true, lowercase: true, maxlength: 120 },
    description: { type: String, default: null },
    status: {
      type: String,
      enum: QUESTION_BANK_STATUSES,
      default: 'active',
      index: true,
    },
    questionCount: { type: Number, default: 0, min: 0 },
    categoryIds: [{ type: Schema.Types.ObjectId, ref: 'QuestionCategory' }],
    tagIds: [{ type: Schema.Types.ObjectId, ref: 'QuestionTag' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: 'question_banks' },
);

questionBankSchema.index(
  { institutionId: 1, slug: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } },
);

export type QuestionBankDocument = InferSchemaType<typeof questionBankSchema> & {
  _id: Types.ObjectId;
};

export const QuestionBankModel = model('QuestionBank', questionBankSchema);
