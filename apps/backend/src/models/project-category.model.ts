import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const projectCategorySchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, required: true, trim: true, lowercase: true, maxlength: 120 },
    description: { type: String, default: null },
    color: { type: String, default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: 'project_categories' },
);

projectCategorySchema.index(
  { institutionId: 1, slug: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } },
);

export type ProjectCategoryDocument = InferSchemaType<typeof projectCategorySchema> & {
  _id: Types.ObjectId;
};

export const ProjectCategoryModel = model('ProjectCategory', projectCategorySchema);
