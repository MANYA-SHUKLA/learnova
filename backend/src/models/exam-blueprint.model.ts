import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const blueprintSlotSchema = new Schema(
  {
    difficulty: { type: String, default: null },
    category: { type: String, default: null },
    marks: { type: Number, default: null, min: 0 },
    count: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const examBlueprintSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', default: null, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: null },
    totalMarks: { type: Number, default: 100, min: 0 },
    slots: { type: [blueprintSlotSchema], default: [] },
    questionPoolIds: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: 'exam_blueprints' },
);

examBlueprintSchema.index({ institutionId: 1, name: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });

export type ExamBlueprintDocument = InferSchemaType<typeof examBlueprintSchema> & { _id: Types.ObjectId };

export const ExamBlueprintModel = model('ExamBlueprint', examBlueprintSchema);
