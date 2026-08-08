import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const semesterSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    number: { type: Number, required: true },
    term: {
      type: String,
      enum: ['odd', 'even', 'summer'],
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['active', 'inactive', 'archived'],
      default: 'active',
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'semesters' },
);

export type SemesterDocument = InferSchemaType<typeof semesterSchema> & {
  _id: Types.ObjectId;
};

export const SemesterModel = model('Semester', semesterSchema);
