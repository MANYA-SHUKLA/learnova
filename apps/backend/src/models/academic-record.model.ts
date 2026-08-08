import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const academicRecordCourseRowSchema = new Schema(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    courseCode: { type: String, default: null },
    courseTitle: { type: String, required: true },
    credits: { type: Number, default: 0 },
    letterGrade: { type: String, default: null },
    gradePoints: { type: Number, default: null },
    percentage: { type: Number, default: null },
    result: { type: String, default: null },
    semesterId: { type: Schema.Types.ObjectId, ref: 'Semester', default: null },
    publishedAt: { type: Date, default: null },
  },
  { _id: false },
);

const academicRecordSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    programId: { type: Schema.Types.ObjectId, ref: 'Program', default: null, index: true },
    semesterId: { type: Schema.Types.ObjectId, ref: 'Semester', default: null, index: true },
    currentVersion: { type: Number, default: 1, min: 1 },
    semesterGpa: { type: Number, default: null },
    cgpa: { type: Number, default: null },
    academicStanding: { type: String, default: null },
    remarks: { type: String, default: null, trim: true, maxlength: 2000 },
    courses: { type: [academicRecordCourseRowSchema], default: [] },
  },
  { timestamps: true, collection: 'academic_records' },
);

academicRecordSchema.index({ institutionId: 1, studentId: 1, programId: 1, semesterId: 1 });

export type AcademicRecordDocument = InferSchemaType<typeof academicRecordSchema> & {
  _id: Types.ObjectId;
};

export const AcademicRecordModel = model('AcademicRecord', academicRecordSchema);
