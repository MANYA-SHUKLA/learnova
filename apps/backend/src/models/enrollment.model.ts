import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const enrollmentSchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    campusId: { type: Schema.Types.ObjectId, ref: 'Campus', default: null, index: true },
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', default: null, index: true },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
      index: true,
    },
    programId: { type: Schema.Types.ObjectId, ref: 'Program', default: null, index: true },
    semesterId: {
      type: Schema.Types.ObjectId,
      ref: 'Semester',
      default: null,
      index: true,
    },
    sectionId: { type: Schema.Types.ObjectId, ref: 'Section', default: null, index: true },
    batchId: { type: Schema.Types.ObjectId, ref: 'Batch', default: null, index: true },
    facultyId: {
      type: Schema.Types.ObjectId,
      ref: 'Faculty',
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: [
        'pending',
        'active',
        'approved',
        'rejected',
        'withdrawn',
        'completed',
        'dropped',
        'suspended',
        'archived',
      ],
      default: 'pending',
      index: true,
    },
    enrollmentMethod: {
      type: String,
      enum: ['self', 'manual', 'bulk', 'import', 'invite', 'promoted'],
      default: 'manual',
      index: true,
    },
    enrollmentDate: { type: Date, default: null, index: true },
    approvalDate: { type: Date, default: null },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    rejectionReason: { type: String, default: null },
    withdrawalDate: { type: Date, default: null },
    withdrawalReason: { type: String, default: null },
    completionDate: { type: Date, default: null },
    completionStatus: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed', 'failed'],
      default: 'not_started',
      index: true,
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    grade: { type: String, default: null },
    score: { type: Number, default: null, min: 0, max: 100 },
    credits: { type: Number, default: 0, min: 0 },
    attendance: { type: Number, default: null, min: 0, max: 100 },
    notes: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: 'enrollments' },
);

enrollmentSchema.index({ institutionId: 1, studentId: 1, courseId: 1 });
enrollmentSchema.index(
  { institutionId: 1, studentId: 1, courseId: 1 },
  {
    unique: true,
    partialFilterExpression: { deletedAt: null },
  },
);
enrollmentSchema.index({ institutionId: 1, courseId: 1, status: 1 });
enrollmentSchema.index({ institutionId: 1, studentId: 1, status: 1 });

export type EnrollmentDocument = InferSchemaType<typeof enrollmentSchema> & {
  _id: Types.ObjectId;
};

export const EnrollmentModel = model('Enrollment', enrollmentSchema);
