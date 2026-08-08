import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const facultySchema = new Schema(
  {
    employeeId: { type: String, required: true, trim: true },
    facultyCode: { type: String, required: true, trim: true, uppercase: true },
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
    programIds: [{ type: Schema.Types.ObjectId, ref: 'Program' }],
    /** Placeholder until Course module — stores future course ObjectIds */
    courseIds: [{ type: Schema.Types.ObjectId }],
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
    address: { type: String, default: null },
    city: { type: String, default: null },
    state: { type: String, default: null },
    country: { type: String, default: null },
    postalCode: { type: String, default: null },
    designation: {
      type: String,
      enum: [
        'assistant_professor',
        'associate_professor',
        'professor',
        'head_of_department',
        'dean',
        'lecturer',
        'research_scientist',
        'custom',
      ],
      required: true,
    },
    customDesignation: { type: String, default: null },
    employmentType: {
      type: String,
      enum: [
        'full_time',
        'part_time',
        'adjunct',
        'guest_faculty',
        'visiting_professor',
        'research_fellow',
        'teaching_assistant',
      ],
      required: true,
    },
    joiningDate: { type: Date, default: null, index: true },
    experienceYears: { type: Number, default: 0, min: 0 },
    highestQualification: { type: String, default: null },
    specialization: { type: String, default: null },
    researchAreas: [{ type: String }],
    bio: { type: String, default: null },
    officeRoom: { type: String, default: null },
    officeHours: { type: String, default: null },
    linkedin: { type: String, default: null },
    website: { type: String, default: null },
    orcid: { type: String, default: null },
    googleScholar: { type: String, default: null },
    emergencyContactName: { type: String, default: null },
    emergencyContactPhone: { type: String, default: null },
    emergencyContactRelation: { type: String, default: null },
    isActive: { type: Boolean, default: true, index: true },
    status: {
      type: String,
      enum: ['active', 'on_leave', 'suspended', 'retired', 'archived'],
      default: 'active',
      index: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: 'faculty' },
);

facultySchema.index({ institutionId: 1, employeeId: 1 }, { unique: true });
facultySchema.index({ institutionId: 1, facultyCode: 1 }, { unique: true });
facultySchema.index({ institutionId: 1, email: 1 }, { unique: true });
facultySchema.index({
  institutionId: 1,
  fullName: 'text',
  email: 'text',
  employeeId: 'text',
  facultyCode: 'text',
  designation: 'text',
});
facultySchema.index({ institutionId: 1, deletedAt: 1, status: 1, createdAt: -1 });
facultySchema.index({ institutionId: 1, deletedAt: 1, departmentId: 1, status: 1 });
facultySchema.index({ institutionId: 1, email: 1, deletedAt: 1 });
facultySchema.index({ courseIds: 1, deletedAt: 1 });

export type FacultyDocument = InferSchemaType<typeof facultySchema> & {
  _id: Types.ObjectId;
};

export const FacultyModel = model('Faculty', facultySchema);
