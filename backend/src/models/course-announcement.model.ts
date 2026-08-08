import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const courseAnnouncementSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, required: true, trim: true, maxlength: 5000 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, collection: 'course_announcements' },
);

export type CourseAnnouncementDocument = InferSchemaType<typeof courseAnnouncementSchema> & {
  _id: Types.ObjectId;
};

export const CourseAnnouncementModel = model('CourseAnnouncement', courseAnnouncementSchema);
