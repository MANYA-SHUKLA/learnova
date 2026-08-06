import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const calendarEventSchema = new Schema(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: [
        'semester_start',
        'semester_end',
        'exam_start',
        'exam_end',
        'holiday',
        'event',
      ],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: null },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
  },
  { _id: false },
);

const academicCalendarSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
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
    events: { type: [calendarEventSchema], default: [] },
    status: {
      type: String,
      enum: ['active', 'inactive', 'archived'],
      default: 'active',
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'academic_calendars' },
);

export type AcademicCalendarDocument = InferSchemaType<typeof academicCalendarSchema> & {
  _id: Types.ObjectId;
};

export const AcademicCalendarModel = model('AcademicCalendar', academicCalendarSchema);
