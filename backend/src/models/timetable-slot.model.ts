import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const timetableSlotSchema = new Schema(
  {
    timetableId: {
      type: Schema.Types.ObjectId,
      ref: 'Timetable',
      required: true,
      index: true,
    },
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
    dayOfWeek: {
      type: String,
      enum: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      required: true,
      index: true,
    },
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, required: true, trim: true },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    courseTitle: { type: String, required: true, trim: true },
    sectionId: {
      type: Schema.Types.ObjectId,
      ref: 'Section',
      required: true,
      index: true,
    },
    sectionName: { type: String, required: true, trim: true },
    facultyId: {
      type: Schema.Types.ObjectId,
      ref: 'Faculty',
      required: true,
      index: true,
    },
    facultyName: { type: String, required: true, trim: true },
    room: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['active', 'cancelled'],
      default: 'active',
      index: true,
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'timetable_slots' },
);

timetableSlotSchema.index({ institutionId: 1, semesterId: 1, dayOfWeek: 1 });
timetableSlotSchema.index({ facultyId: 1, dayOfWeek: 1 });
timetableSlotSchema.index({ sectionId: 1, dayOfWeek: 1 });

export type TimetableSlotDocument = InferSchemaType<typeof timetableSlotSchema> & {
  _id: Types.ObjectId;
};

export const TimetableSlotModel = model('TimetableSlot', timetableSlotSchema);
