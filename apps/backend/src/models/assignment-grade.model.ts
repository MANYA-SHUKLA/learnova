import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

export const ASSIGNMENT_GRADING_METHODS = [
  'manual',
  'rubric',
  'pass_fail',
  'marks',
  'percentage',
] as const;

const assignmentRubricScoreSchema = new Schema(
  {
    criterionId: { type: String, required: true },
    points: { type: Number, required: true, min: 0 },
    comment: { type: String, default: null },
  },
  { _id: false },
);

const assignmentGradeSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
      index: true,
    },
    submissionId: {
      type: Schema.Types.ObjectId,
      ref: 'AssignmentSubmission',
      required: true,
      index: true,
    },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    gradingMethod: {
      type: String,
      enum: ASSIGNMENT_GRADING_METHODS,
      default: 'marks',
    },
    marksObtained: { type: Number, default: null },
    percentage: { type: Number, default: null },
    passed: { type: Boolean, default: null, index: true },
    feedback: { type: String, default: null },
    rubricScores: { type: [assignmentRubricScoreSchema], default: [] },
    gradedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    gradedAt: { type: Date, default: null, index: true },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: 'assignment_grades' },
);

assignmentGradeSchema.index({ institutionId: 1, assignmentId: 1, studentId: 1 });
assignmentGradeSchema.index({ institutionId: 1, studentId: 1, gradedAt: -1 });
assignmentGradeSchema.index({ submissionId: 1 }, { partialFilterExpression: { deletedAt: null } });

export type AssignmentGradeDocument = InferSchemaType<typeof assignmentGradeSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const AssignmentGradeModel = model('AssignmentGrade', assignmentGradeSchema);
