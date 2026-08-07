import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { GRADE_COMMENT_VISIBILITIES } from '@learnova/constants';

const gradeCommentSchema = new Schema(
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
      default: null,
      index: true,
    },
    gradebookEntryId: {
      type: Schema.Types.ObjectId,
      ref: 'GradebookEntry',
      default: null,
      index: true,
    },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    visibility: {
      type: String,
      enum: GRADE_COMMENT_VISIBILITIES,
      default: 'faculty',
      index: true,
    },
    body: { type: String, required: true, trim: true, maxlength: 5000 },
  },
  { timestamps: true, collection: 'grade_comments' },
);

gradeCommentSchema.index({ institutionId: 1, courseId: 1, studentId: 1, createdAt: -1 });

export type GradeCommentDocument = InferSchemaType<typeof gradeCommentSchema> & {
  _id: Types.ObjectId;
};

export const GradeCommentModel = model('GradeComment', gradeCommentSchema);
