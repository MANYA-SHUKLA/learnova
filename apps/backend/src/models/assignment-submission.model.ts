import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const fileRefSchema = new Schema(
  {
    id: { type: String, required: true },
    fileName: { type: String, required: true, trim: true },
    contentType: { type: String, required: true },
    sizeBytes: { type: Number, required: true, min: 0 },
    storageKey: { type: String, required: true },
    url: { type: String, default: null },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const assignmentSubmissionSchema = new Schema(
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
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    attemptNumber: { type: Number, required: true, min: 1, default: 1 },
    submittedAt: { type: Date, default: null, index: true },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'late', 'returned', 'graded', 'missing'],
      default: 'draft',
      index: true,
    },
    submissionType: {
      type: String,
      enum: ['text', 'file', 'link', 'mixed'],
      default: 'mixed',
    },
    files: { type: [fileRefSchema], default: [] },
    textSubmission: { type: String, default: null },
    links: { type: [String], default: [] },
    timeSpentMinutes: { type: Number, default: null },
    lateSubmission: { type: Boolean, default: false, index: true },
    plagiarismScore: { type: Number, default: null, min: 0, max: 100 },
    gradeId: { type: Schema.Types.ObjectId, ref: 'AssignmentGrade', default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: 'assignment_submissions' },
);

assignmentSubmissionSchema.index(
  { assignmentId: 1, studentId: 1, attemptNumber: 1, deletedAt: 1 },
  { unique: true },
);
assignmentSubmissionSchema.index({ institutionId: 1, status: 1, deletedAt: 1 });

export type AssignmentSubmissionDocument = InferSchemaType<typeof assignmentSubmissionSchema> & {
  _id: Types.ObjectId;
};

export const AssignmentSubmissionModel = model(
  'AssignmentSubmission',
  assignmentSubmissionSchema,
);
