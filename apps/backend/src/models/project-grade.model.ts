import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { PROJECT_GRADING_METHODS } from '@learnova/constants';

export { PROJECT_GRADING_METHODS };

const rubricScoreSchema = new Schema(
  {
    criterionId: { type: String, required: true },
    points: { type: Number, required: true, min: 0 },
    comment: { type: String, default: null },
  },
  { _id: false },
);

const projectGradeSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    submissionId: {
      type: Schema.Types.ObjectId,
      ref: 'ProjectSubmission',
      required: true,
      unique: true,
      index: true,
    },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', default: null, index: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'ProjectTeam', default: null, index: true },
    gradingMethod: {
      type: String,
      enum: PROJECT_GRADING_METHODS,
      default: 'marks',
    },
    marksObtained: { type: Number, default: null },
    percentage: { type: Number, default: null, min: 0, max: 100 },
    passed: { type: Boolean, default: null },
    feedback: { type: String, default: null },
    rubricScores: { type: [rubricScoreSchema], default: [] },
    preparedForGradebook: { type: Boolean, default: false, index: true },
    gradedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    gradedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: 'project_grades' },
);

export type ProjectGradeDocument = InferSchemaType<typeof projectGradeSchema> & {
  _id: Types.ObjectId;
};

export const ProjectGradeModel = model('ProjectGrade', projectGradeSchema);
