import { Schema, model, type InferSchemaType } from 'mongoose';

const courseSchema = new Schema(
  {
    courseCode: { type: String, required: true, trim: true, uppercase: true, index: true },
    title: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    description: { type: String, default: null, trim: true },
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
    programId: {
      type: Schema.Types.ObjectId,
      ref: 'Program',
      default: null,
      index: true,
    },
    semesterId: {
      type: Schema.Types.ObjectId,
      ref: 'Semester',
      default: null,
      index: true,
    },
    credits: { type: Number, default: 0, min: 0, max: 50 },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    facultyIds: [{ type: Schema.Types.ObjectId, ref: 'Faculty' }],
    coordinatorId: {
      type: Schema.Types.ObjectId,
      ref: 'Faculty',
      default: null,
      index: true,
    },
    thumbnailUrl: { type: String, default: null },
    bannerUrl: { type: String, default: null },
    objectives: [{ type: String }],
    prerequisites: [{ type: String }],
    syllabus: { type: String, default: null },
    tags: [{ type: String }],
    isActive: { type: Boolean, default: true, index: true },
    publishedAt: { type: Date, default: null, index: true },
    archivedAt: { type: Date, default: null, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: 'courses' },
);

courseSchema.index({ institutionId: 1, slug: 1 });
courseSchema.index({ institutionId: 1, status: 1 });
courseSchema.index({ institutionId: 1, departmentId: 1 });
courseSchema.index({ tags: 1 });

export type CourseDocument = InferSchemaType<typeof courseSchema> & {
  _id: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const CourseModel = model<CourseDocument>('Course', courseSchema);
