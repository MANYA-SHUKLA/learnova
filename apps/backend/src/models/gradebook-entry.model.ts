import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import {
  GRADEBOOK_ENTRY_STATUSES,
  GRADEBOOK_SOURCE_COLLECTIONS,
} from '@learnova/constants';

const gradebookEntrySchema = new Schema(
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
    activityKind: {
      type: String,
      enum: ['assignment', 'lab', 'quiz', 'exam', 'project'],
      required: true,
      index: true,
    },
    activityId: { type: Schema.Types.ObjectId, required: true, index: true },
    activityTitle: { type: String, required: true, trim: true },
    sourceCollection: {
      type: String,
      enum: GRADEBOOK_SOURCE_COLLECTIONS,
      required: true,
    },
    sourceRefId: { type: Schema.Types.ObjectId, required: true, index: true },
    gradingMethod: {
      type: String,
      enum: ['manual', 'rubric', 'pass_fail', 'marks', 'percentage', 'auto'],
      default: 'marks',
    },
    marksObtained: { type: Number, default: null },
    totalMarks: { type: Number, default: null },
    percentage: { type: Number, default: null, min: 0, max: 100 },
    passed: { type: Boolean, default: null },
    weightage: { type: Number, default: 0, min: 0, max: 100 },
    status: {
      type: String,
      enum: GRADEBOOK_ENTRY_STATUSES,
      default: 'final',
      index: true,
    },
    consumedAt: { type: Date, default: Date.now, index: true },
    gradedAt: { type: Date, default: null },
    gradedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: 'gradebook_entries' },
);

gradebookEntrySchema.index(
  { institutionId: 1, sourceCollection: 1, sourceRefId: 1 },
  { unique: true },
);
gradebookEntrySchema.index({ institutionId: 1, courseId: 1, studentId: 1, activityKind: 1 });
gradebookEntrySchema.index({ institutionId: 1, courseId: 1, status: 1 });

export type GradebookEntryDocument = InferSchemaType<typeof gradebookEntrySchema> & {
  _id: Types.ObjectId;
};

export const GradebookEntryModel = model('GradebookEntry', gradebookEntrySchema);
