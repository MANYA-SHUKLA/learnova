import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { ACADEMIC_STANDING_TYPES } from '@learnova/constants';

const academicStandingSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    semesterId: { type: Schema.Types.ObjectId, ref: 'Semester', default: null, index: true },
    programId: { type: Schema.Types.ObjectId, ref: 'Program', default: null, index: true },
    standing: { type: String, enum: ACADEMIC_STANDING_TYPES, required: true, index: true },
    semesterGpa: { type: Number, default: null, min: 0, max: 4 },
    cgpa: { type: Number, default: null, min: 0, max: 4 },
    failedCourseCount: { type: Number, default: 0, min: 0 },
    publishedCourseCount: { type: Number, default: 0, min: 0 },
    computedAt: { type: Date, required: true, index: true },
  },
  { timestamps: true, collection: 'academic_standings' },
);

academicStandingSchema.index(
  { institutionId: 1, studentId: 1, semesterId: 1 },
  { unique: true, sparse: true },
);

export type AcademicStandingDocument = InferSchemaType<typeof academicStandingSchema> & {
  _id: Types.ObjectId;
};

export const AcademicStandingModel = model('AcademicStanding', academicStandingSchema);
