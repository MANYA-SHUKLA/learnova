import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const gradeHistorySchema = new Schema(
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
    field: { type: String, required: true, trim: true, index: true },
    oldValue: { type: Schema.Types.Mixed, default: null },
    newValue: { type: Schema.Types.Mixed, default: null },
    reason: { type: String, default: null, trim: true },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'grade_histories' },
);

gradeHistorySchema.index({ institutionId: 1, courseGradeId: 1, createdAt: -1 });

export type GradeHistoryDocument = InferSchemaType<typeof gradeHistorySchema> & {
  _id: Types.ObjectId;
};

export const GradeHistoryModel = model('GradeHistory', gradeHistorySchema);
