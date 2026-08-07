import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { COURSE_GRADE_STATUSES } from '@learnova/constants';

const courseGradeSummarySchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    enrollmentId: { type: Schema.Types.ObjectId, ref: 'Enrollment', default: null, index: true },
    weightedPercentage: { type: Number, default: null, min: 0, max: 100 },
    letterGrade: { type: String, default: null, trim: true },
    totalMarksEarned: { type: Number, default: 0, min: 0 },
    totalMarksPossible: { type: Number, default: 0, min: 0 },
    entryCount: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: COURSE_GRADE_STATUSES,
      default: 'draft',
      index: true,
    },
    finalizedAt: { type: Date, default: null },
    finalizedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true, collection: 'course_grade_summaries' },
);

courseGradeSummarySchema.index(
  { institutionId: 1, courseId: 1, studentId: 1 },
  { unique: true },
);

export type CourseGradeSummaryDocument = InferSchemaType<typeof courseGradeSummarySchema> & {
  _id: Types.ObjectId;
};

export const CourseGradeSummaryModel = model('CourseGradeSummary', courseGradeSummarySchema);
