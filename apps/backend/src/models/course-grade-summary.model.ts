import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import {
  COURSE_GRADE_STATUSES,
  GRADE_RESULTS,
} from '@learnova/constants';

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
    semesterId: { type: Schema.Types.ObjectId, ref: 'Semester', default: null, index: true },
    facultyId: { type: Schema.Types.ObjectId, ref: 'Faculty', default: null, index: true },
    weightedPercentage: { type: Number, default: null, min: 0, max: 100 },
    finalMarks: { type: Number, default: null, min: 0 },
    percentage: { type: Number, default: null, min: 0, max: 100 },
    letterGrade: { type: String, default: null, trim: true, index: true },
    gradePoints: { type: Number, default: null, min: 0, max: 4 },
    result: { type: String, enum: GRADE_RESULTS, default: null, index: true },
    totalMarksEarned: { type: Number, default: 0, min: 0 },
    totalMarksPossible: { type: Number, default: 0, min: 0 },
    entryCount: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: COURSE_GRADE_STATUSES,
      default: 'draft',
      index: true,
    },
    locked: { type: Boolean, default: false, index: true },
    published: { type: Boolean, default: false, index: true },
    publishedAt: { type: Date, default: null },
    finalizedAt: { type: Date, default: null },
    finalizedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    lockedAt: { type: Date, default: null },
    lockedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true, collection: 'course_grade_summaries' },
);

courseGradeSummarySchema.index(
  { institutionId: 1, courseId: 1, studentId: 1 },
  { unique: true },
);
courseGradeSummarySchema.index({ institutionId: 1, semesterId: 1, studentId: 1 });
courseGradeSummarySchema.index({ institutionId: 1, courseId: 1, locked: 1, published: 1 });

export type CourseGradeSummaryDocument = InferSchemaType<typeof courseGradeSummarySchema> & {
  _id: Types.ObjectId;
};

export const CourseGradeSummaryModel = model('CourseGradeSummary', courseGradeSummarySchema);
