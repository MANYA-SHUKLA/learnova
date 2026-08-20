import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const timetableSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    semesterId: {
      type: Schema.Types.ObjectId,
      ref: 'Semester',
      required: true,
      index: true,
    },
    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    publishedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'timetables' },
);

timetableSchema.index(
  { institutionId: 1, semesterId: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } },
);

export type TimetableDocument = InferSchemaType<typeof timetableSchema> & {
  _id: Types.ObjectId;
};

export const TimetableModel = model('Timetable', timetableSchema);
