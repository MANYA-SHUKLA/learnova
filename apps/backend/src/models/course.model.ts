import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const courseSchema = new Schema(
  {
    courseCode: { type: String, required: true, trim: true, uppercase: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    title: { type: String, required: true, trim: true, index: true },
    subtitle: { type: String, default: null, trim: true },
    description: { type: String, default: null },
    shortDescription: { type: String, default: null },
    thumbnail: { type: String, default: null },
    banner: { type: String, default: null },
    icon: { type: String, default: null },
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
    semesterIds: [{ type: Schema.Types.ObjectId, ref: 'Semester' }],
    facultyIds: [{ type: Schema.Types.ObjectId, ref: 'Faculty' }],
    coordinatorId: {
      type: Schema.Types.ObjectId,
      ref: 'Faculty',
      default: null,
      index: true,
    },
    category: {
      type: String,
      enum: [
        'programming',
        'cyber_security',
        'ai',
        'cloud',
        'networking',
        'database',
        'electronics',
        'mechanical',
        'mathematics',
        'general',
        'custom',
      ],
      default: 'general',
      index: true,
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'beginner',
      index: true,
    },
    language: { type: String, default: 'en', trim: true, index: true },
    credits: { type: Number, default: 0, min: 0, max: 50 },
    estimatedHours: { type: Number, default: null, min: 0 },
    duration: { type: String, default: null },
    status: {
      type: String,
      enum: ['draft', 'review', 'published', 'archived', 'scheduled'],
      default: 'draft',
      index: true,
    },
    visibility: {
      type: String,
      enum: ['private', 'institution', 'public', 'invite_only'],
      default: 'institution',
      index: true,
    },
    version: { type: Number, default: 1, min: 1 },
    tags: [{ type: String }],
    learningObjectives: [{ type: String }],
    prerequisites: [{ type: String }],
    requirements: [{ type: String }],
    outcomes: [{ type: String }],
    skills: [{ type: String }],
    certificateEnabled: { type: Boolean, default: false },
    discussionEnabled: { type: Boolean, default: true },
    allowDownloads: { type: Boolean, default: true },
    allowPreview: { type: Boolean, default: false },
    maxStudents: { type: Number, default: null, min: 1 },
    enrollmentMode: {
      type: String,
      enum: ['open', 'approval', 'invite', 'closed'],
      default: 'open',
    },
    publishDate: { type: Date, default: null, index: true },
    archiveDate: { type: Date, default: null },
    seoTitle: { type: String, default: null },
    seoDescription: { type: String, default: null },
    seoKeywords: [{ type: String }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: 'courses' },
);

courseSchema.index({ institutionId: 1, courseCode: 1 }, { unique: true });
courseSchema.index({ institutionId: 1, slug: 1 }, { unique: true });
courseSchema.index({
  institutionId: 1,
  title: 'text',
  courseCode: 'text',
  tags: 'text',
  category: 'text',
});

export type CourseDocument = InferSchemaType<typeof courseSchema> & {
  _id: Types.ObjectId;
};

export const CourseModel = model('Course', courseSchema);
