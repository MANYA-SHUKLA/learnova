import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { COURSE_GRADE_STATUSES } from '@learnova/constants';

const semesterGradeSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    semesterId: { type: Schema.Types.ObjectId, ref: 'Semester', required: true, index: true },
    programId: { type: Schema.Types.ObjectId, ref: 'Program', default: null, index: true },
    semesterGpa: { type: Number, default: null, min: 0, max: 4 },
    totalCredits: { type: Number, default: 0, min: 0 },
    earnedCredits: { type: Number, default: 0, min: 0 },
    courseCount: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: COURSE_GRADE_STATUSES,
      default: 'draft',
      index: true,
    },
    locked: { type: Boolean, default: false, index: true },
    published: { type: Boolean, default: false, index: true },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'semester_grades' },
);

semesterGradeSchema.index({ institutionId: 1, studentId: 1, semesterId: 1 }, { unique: true });

export type SemesterGradeDocument = InferSchemaType<typeof semesterGradeSchema> & {
  _id: Types.ObjectId;
};

export const SemesterGradeModel = model('SemesterGrade', semesterGradeSchema);
