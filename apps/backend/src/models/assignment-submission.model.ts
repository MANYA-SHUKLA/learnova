import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { assignmentFileRefSchema } from './assignment.model.js';

export const ASSIGNMENT_SUBMISSION_STATUSES = [
  'draft',
  'submitted',
  'late',
  'returned',
  'graded',
  'missing',
] as const;

export const ASSIGNMENT_SUBMISSION_TYPES = ['text', 'file', 'link', 'mixed'] as const;

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
    attemptNumber: { type: Number, default: 1, min: 1 },
    submittedAt: { type: Date, default: null, index: true },
    status: {
      type: String,
      enum: ASSIGNMENT_SUBMISSION_STATUSES,
      default: 'draft',
      index: true,
    },
    submissionType: {
      type: String,
      enum: ASSIGNMENT_SUBMISSION_TYPES,
      default: 'mixed',
    },
    files: { type: [assignmentFileRefSchema], default: [] },
    textSubmission: { type: String, default: null },
    links: { type: [String], default: [] },
    timeSpentMinutes: { type: Number, default: null },
    lateSubmission: { type: Boolean, default: false, index: true },
    plagiarismScore: { type: Number, default: null },
    gradeId: { type: Schema.Types.ObjectId, ref: 'AssignmentGrade', default: null, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: 'assignment_submissions' },
);

assignmentSubmissionSchema.index(
  { assignmentId: 1, studentId: 1, attemptNumber: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } },
);
assignmentSubmissionSchema.index({ institutionId: 1, assignmentId: 1, status: 1 });
assignmentSubmissionSchema.index({ institutionId: 1, studentId: 1, status: 1 });
assignmentSubmissionSchema.index({ institutionId: 1, courseId: 1, status: 1 });

export type AssignmentSubmissionDocument = InferSchemaType<typeof assignmentSubmissionSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const AssignmentSubmissionModel = model(
  'AssignmentSubmission',
  assignmentSubmissionSchema,
);
