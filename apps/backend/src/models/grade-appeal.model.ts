import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { GRADE_APPEAL_STATUSES } from '@learnova/constants';

const gradeAppealSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    courseGradeId: {
      type: Schema.Types.ObjectId,
      ref: 'CourseGradeSummary',
      required: true,
      index: true,
    },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    reason: { type: String, required: true, trim: true, maxlength: 5000 },
    status: {
      type: String,
      enum: GRADE_APPEAL_STATUSES,
      default: 'pending',
      index: true,
    },
    submittedAt: { type: Date, default: Date.now, index: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    resolutionNotes: { type: String, default: null, trim: true, maxlength: 5000 },
  },
  { timestamps: true, collection: 'grade_appeals' },
);

gradeAppealSchema.index({ institutionId: 1, courseGradeId: 1, studentId: 1, status: 1 });

export type GradeAppealDocument = InferSchemaType<typeof gradeAppealSchema> & {
  _id: Types.ObjectId;
};

export const GradeAppealModel = model('GradeAppeal', gradeAppealSchema);
