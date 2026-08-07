import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { PRACTICE_LANGUAGES } from '@learnova/constants';

const languageSchema = new Schema(
  {
    key: { type: String, enum: PRACTICE_LANGUAGES, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    judge0Id: { type: Number, required: true },
    monacoLanguage: { type: String, required: true },
    version: { type: String, default: null },
    enabled: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'practice_languages' },
);

languageSchema.index({ enabled: 1, order: 1 });

export type LanguageDocument = InferSchemaType<typeof languageSchema> & {
  _id: Types.ObjectId;
};

export const LanguageModel = model('PracticeLanguage', languageSchema);
