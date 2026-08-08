import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const departmentSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    description: { type: String, default: null },
    status: {
      type: String,
      enum: ['active', 'inactive', 'archived'],
      default: 'active',
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'departments' },
);

departmentSchema.index({ institutionId: 1, code: 1 }, { unique: true });

export type DepartmentDocument = InferSchemaType<typeof departmentSchema> & {
  _id: Types.ObjectId;
};

export const DepartmentModel = model('Department', departmentSchema);
