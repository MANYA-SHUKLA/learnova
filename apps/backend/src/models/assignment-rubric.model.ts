import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const assignmentRubricCriterionSchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: null },
    weight: { type: Number, default: 0, min: 0, max: 100 },
    maxPoints: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const assignmentRubricSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, index: true },
    description: { type: String, default: null },
    criteria: { type: [assignmentRubricCriterionSchema], default: [] },
    totalPoints: { type: Number, default: 0, min: 0 },
    reusable: { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: 'assignment_rubrics' },
);

assignmentRubricSchema.index({ institutionId: 1, createdAt: -1 });
assignmentRubricSchema.index({ institutionId: 1, reusable: 1 });

export type AssignmentRubricDocument = InferSchemaType<typeof assignmentRubricSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const AssignmentRubricModel = model('AssignmentRubric', assignmentRubricSchema);
