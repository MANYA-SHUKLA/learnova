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
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
      index: true,
    },
    programId: { type: Schema.Types.ObjectId, ref: 'Program', default: null, index: true },
    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: 'AcademicYear',
      default: null,
      index: true,
    },
    semesterId: {
      type: Schema.Types.ObjectId,
      ref: 'Semester',
      default: null,
      index: true,
    },
    sectionId: { type: Schema.Types.ObjectId, ref: 'Section', default: null, index: true },
    facultyId: {
      type: Schema.Types.ObjectId,
      ref: 'Faculty',
      default: null,
      index: true,
    },
    enrollmentNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    enrollmentDate: { type: Date, default: Date.now, index: true },
    enrollmentMethod: {
      type: String,
      enum: ['manual', 'bulk_import', 'self_enrollment', 'invite', 'api'],
      default: 'manual',
      index: true,
    },
    status: {
      type: String,
      enum: [
        'pending',
        'approved',
        'rejected',
        'active',
        'completed',
        'withdrawn',
        'dropped',
        'expired',
      ],
      default: 'pending',
      index: true,
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'not_required'],
      default: 'not_required',
      index: true,
    },
    completionStatus: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started',
      index: true,
    },
    completionDate: { type: Date, default: null },
    withdrawReason: { type: String, default: null },
    droppedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    notes: { type: String, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: 'enrollments' },
);

enrollmentSchema.index(
  { institutionId: 1, studentId: 1, courseId: 1 },
  {
    unique: true,
    partialFilterExpression: { deletedAt: null },
  },
);
enrollmentSchema.index({ institutionId: 1, enrollmentNumber: 1 }, { unique: true });
enrollmentSchema.index({ institutionId: 1, courseId: 1, status: 1 });
enrollmentSchema.index({ institutionId: 1, studentId: 1, status: 1 });
enrollmentSchema.index({ institutionId: 1, facultyId: 1, status: 1 });

export type EnrollmentDocument = InferSchemaType<typeof enrollmentSchema> & {
  _id: Types.ObjectId;
};

export const EnrollmentModel = model('Enrollment', enrollmentSchema);
