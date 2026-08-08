import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { TRANSCRIPT_STATUSES, TRANSCRIPT_TYPES } from '@learnova/constants';

const transcriptCourseRowSchema = new Schema(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    courseCode: { type: String, default: null, trim: true },
    courseTitle: { type: String, required: true, trim: true },
    credits: { type: Number, default: 0, min: 0 },
    letterGrade: { type: String, default: null, trim: true },
    gradePoints: { type: Number, default: null, min: 0, max: 4 },
    percentage: { type: Number, default: null, min: 0, max: 100 },
    result: { type: String, default: null, trim: true },
    semesterId: { type: Schema.Types.ObjectId, ref: 'Semester', default: null },
    publishedAt: { type: Date, default: null },
  },
  { _id: false },
);

const academicTranscriptSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    transcriptNumber: { type: String, required: true, unique: true, index: true, trim: true },
    transcriptType: { type: String, enum: TRANSCRIPT_TYPES, default: 'official', index: true },
    programId: { type: Schema.Types.ObjectId, ref: 'Program', default: null, index: true },
    semesterId: { type: Schema.Types.ObjectId, ref: 'Semester', default: null, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', default: null, index: true },
    verificationCode: { type: String, required: true, unique: true, index: true, uppercase: true },
    verificationURL: { type: String, required: true, trim: true },
    status: { type: String, enum: TRANSCRIPT_STATUSES, default: 'issued', index: true },
    version: { type: Number, default: 1, min: 1 },
    semesterGpa: { type: Number, default: null, min: 0, max: 4 },
    cgpa: { type: Number, default: null, min: 0, max: 4 },
    academicStanding: { type: String, default: null, trim: true },
    remarks: { type: String, default: null, trim: true, maxlength: 2000 },
    courses: { type: [transcriptCourseRowSchema], default: [] },
    documentPayload: { type: Schema.Types.Mixed, required: true },
    issuedAt: { type: Date, default: null, index: true },
    issuedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    revokedAt: { type: Date, default: null },
    revokedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    revocationReason: { type: String, default: null, trim: true, maxlength: 2000 },
    downloadCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, collection: 'academic_transcripts' },
);

academicTranscriptSchema.index({ institutionId: 1, studentId: 1, transcriptType: 1, version: -1 });

export type AcademicTranscriptDocument = InferSchemaType<typeof academicTranscriptSchema> & {
  _id: Types.ObjectId;
};

export const AcademicTranscriptModel = model('AcademicTranscript', academicTranscriptSchema);
