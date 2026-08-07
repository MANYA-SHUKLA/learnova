import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const projectTagSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 50 },
    slug: { type: String, required: true, trim: true, lowercase: true, maxlength: 60 },
    color: { type: String, default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: 'project_tags' },
);

projectTagSchema.index(
  { institutionId: 1, slug: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } },
);

export type ProjectTagDocument = InferSchemaType<typeof projectTagSchema> & {
  _id: Types.ObjectId;
};

export const ProjectTagModel = model('ProjectTag', projectTagSchema);
