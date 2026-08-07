import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const gradebookSnapshotSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    courseGradeId: {
      type: Schema.Types.ObjectId,
      ref: 'CourseGradeSummary',
      required: true,
      index: true,
    },
    version: { type: Number, required: true, min: 1 },
    summary: { type: Schema.Types.Mixed, required: true },
    entries: { type: [Schema.Types.Mixed], default: [] },
    frozenAt: { type: Date, required: true, index: true },
    frozenBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    immutable: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'gradebook_snapshots' },
);

gradebookSnapshotSchema.index(
  { institutionId: 1, courseId: 1, studentId: 1, version: 1 },
  { unique: true },
);
gradebookSnapshotSchema.index({ institutionId: 1, courseGradeId: 1, version: -1 });

export type GradebookSnapshotDocument = InferSchemaType<typeof gradebookSnapshotSchema> & {
  _id: Types.ObjectId;
};

export const GradebookSnapshotModel = model('GradebookSnapshot', gradebookSnapshotSchema);
