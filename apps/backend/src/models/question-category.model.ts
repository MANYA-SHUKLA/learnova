import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const questionCategorySchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 100, index: true },
    slug: { type: String, required: true, trim: true, lowercase: true, maxlength: 120 },
    description: { type: String, default: null },
    questionCount: { type: Number, default: 0, min: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: 'question_categories' },
);

questionCategorySchema.index(
  { institutionId: 1, slug: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } },
);

export type QuestionCategoryDocument = InferSchemaType<typeof questionCategorySchema> & {
  _id: Types.ObjectId;
};

export const QuestionCategoryModel = model('QuestionCategory', questionCategorySchema);
