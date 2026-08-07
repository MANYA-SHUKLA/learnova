import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

export const ASSIGNMENT_TYPES = [
  'homework',
  'essay',
  'research',
  'presentation',
  'case_study',
  'document_upload',
  'pdf_upload',
  'image_upload',
  'video_upload',
  'mixed',
] as const;

export const ASSIGNMENT_STATUSES = ['draft', 'published', 'archived', 'closed'] as const;

export const ASSIGNMENT_VISIBILITIES = ['institution', 'enrolled', 'faculty'] as const;

export const assignmentFileRefSchema = new Schema(
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

const assignmentSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    moduleId: { type: Schema.Types.ObjectId, ref: 'CourseModule', default: null, index: true },
    lessonId: { type: Schema.Types.ObjectId, ref: 'CourseLesson', default: null, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200, index: true },
    description: { type: String, default: null },
    instructions: { type: String, default: null },
    assignmentType: {
      type: String,
      enum: ASSIGNMENT_TYPES,
      default: 'homework',
      index: true,
    },
    visibility: {
      type: String,
      enum: ASSIGNMENT_VISIBILITIES,
      default: 'enrolled',
      index: true,
    },
    status: {
      type: String,
      enum: ASSIGNMENT_STATUSES,
      default: 'draft',
      index: true,
    },
    totalMarks: { type: Number, default: 100, min: 0 },
    passingMarks: { type: Number, default: 40, min: 0 },
    weightage: { type: Number, default: 0, min: 0, max: 100 },
    allowLateSubmission: { type: Boolean, default: true },
    latePenaltyPercent: { type: Number, default: 0, min: 0, max: 100 },
    allowResubmission: { type: Boolean, default: false },
    maxAttempts: { type: Number, default: 1, min: 1, max: 20 },
    publishDate: { type: Date, default: null, index: true },
    dueDate: { type: Date, default: null, index: true },
    closeDate: { type: Date, default: null, index: true },
    estimatedMinutes: { type: Number, default: null },
    attachments: { type: [assignmentFileRefSchema], default: [] },
    rubricId: { type: Schema.Types.ObjectId, ref: 'AssignmentRubric', default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: 'assignments' },
);

assignmentSchema.index({ institutionId: 1, courseId: 1, status: 1, deletedAt: 1 });
assignmentSchema.index({ institutionId: 1, title: 'text', description: 'text' });

export type AssignmentDocument = InferSchemaType<typeof assignmentSchema> & {
  _id: Types.ObjectId;
};

export const AssignmentModel = model('Assignment', assignmentSchema);
