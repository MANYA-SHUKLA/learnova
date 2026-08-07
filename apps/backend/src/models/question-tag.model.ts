import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const questionTagSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 50, index: true },
    slug: { type: String, required: true, trim: true, lowercase: true, maxlength: 60 },
    questionCount: { type: Number, default: 0, min: 0 },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: 'question_tags' },
);

questionTagSchema.index(
  { institutionId: 1, slug: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } },
);

export type QuestionTagDocument = InferSchemaType<typeof questionTagSchema> & {
  _id: Types.ObjectId;
};

export const QuestionTagModel = model('QuestionTag', questionTagSchema);
