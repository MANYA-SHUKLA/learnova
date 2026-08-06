import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const academicYearSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['active', 'inactive', 'archived'],
      default: 'active',
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'academic_years' },
);

academicYearSchema.index({ institutionId: 1, name: 1 }, { unique: true });

export type AcademicYearDocument = InferSchemaType<typeof academicYearSchema> & {
  _id: Types.ObjectId;
};

export const AcademicYearModel = model('AcademicYear', academicYearSchema);
