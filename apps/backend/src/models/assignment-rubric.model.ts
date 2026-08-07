import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const criterionSchema = new Schema(
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
    title: { type: String, required: true, trim: true, maxlength: 200, index: true },
    description: { type: String, default: null },
    criteria: { type: [criterionSchema], default: [] },
    totalPoints: { type: Number, default: 0, min: 0 },
    reusable: { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: 'assignment_rubrics' },
);

export type AssignmentRubricDocument = InferSchemaType<typeof assignmentRubricSchema> & {
  _id: Types.ObjectId;
};

export const AssignmentRubricModel = model('AssignmentRubric', assignmentRubricSchema);
