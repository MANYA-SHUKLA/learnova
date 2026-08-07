import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const studentSchema = new Schema(
  {
    studentId: { type: String, required: true, trim: true },
    admissionNumber: { type: String, required: true, trim: true },
    rollNumber: { type: String, default: null, trim: true },
    registrationNumber: { type: String, default: null, trim: true },
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
    batchId: { type: Schema.Types.ObjectId, ref: 'Batch', default: null, index: true },
    firstName: { type: String, required: true, trim: true },
    middleName: { type: String, default: null, trim: true },
    lastName: { type: String, required: true, trim: true },
    fullName: { type: String, required: true, trim: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    alternateEmail: { type: String, default: null, lowercase: true, trim: true },
    phone: { type: String, default: null, trim: true },
    alternatePhone: { type: String, default: null, trim: true },
    profilePhoto: { type: String, default: null },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
      default: null,
    },
    dateOfBirth: { type: Date, default: null },
    bloodGroup: { type: String, default: null },
    nationality: { type: String, default: null },
    religion: { type: String, default: null },
    category: { type: String, default: null },
    address: { type: String, default: null },
    city: { type: String, default: null },
    state: { type: String, default: null },
    country: { type: String, default: null },
    postalCode: { type: String, default: null },
    guardianName: { type: String, default: null },
    guardianRelation: { type: String, default: null },
    guardianPhone: { type: String, default: null },
    guardianEmail: { type: String, default: null, lowercase: true, trim: true },
    emergencyContactName: { type: String, default: null },
    emergencyContactPhone: { type: String, default: null },
    admissionDate: { type: Date, default: null, index: true },
    expectedGraduationDate: { type: Date, default: null },
    programDuration: { type: Number, default: null, min: 1, max: 12 },
    yearOfStudy: { type: Number, default: null, min: 1, max: 10, index: true },
    currentSemester: { type: Number, default: null, min: 1, max: 20 },
    scholarship: { type: Boolean, default: false, index: true },
    hostelResident: { type: Boolean, default: false },
    transportRequired: { type: Boolean, default: false },
    bio: { type: String, default: null },
    linkedin: { type: String, default: null },
    website: { type: String, default: null },
    isActive: { type: Boolean, default: true, index: true },
    status: {
      type: String,
      enum: [
        'active',
        'inactive',
        'suspended',
        'graduated',
        'dropped',
        'transferred',
        'archived',
      ],
      default: 'active',
      index: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: 'students' },
);

studentSchema.index({ institutionId: 1, studentId: 1 }, { unique: true });
studentSchema.index({ institutionId: 1, admissionNumber: 1 }, { unique: true });
studentSchema.index({ institutionId: 1, email: 1 }, { unique: true });
studentSchema.index({
  institutionId: 1,
  fullName: 'text',
  email: 'text',
  studentId: 'text',
  admissionNumber: 'text',
  rollNumber: 'text',
});

export type StudentDocument = InferSchemaType<typeof studentSchema> & {
  _id: Types.ObjectId;
};

export const StudentModel = model('Student', studentSchema);
