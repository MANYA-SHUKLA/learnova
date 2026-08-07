import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const enrollmentWaitlistSchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    position: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ['waiting', 'promoted', 'left', 'expired'],
      default: 'waiting',
      index: true,
    },
    joinedAt: { type: Date, default: Date.now, index: true },
    promotedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    notes: { type: String, default: null },
  },
  { timestamps: true, collection: 'enrollment_waitlists' },
);

enrollmentWaitlistSchema.index({ institutionId: 1, courseId: 1, position: 1 });
enrollmentWaitlistSchema.index({ institutionId: 1, courseId: 1, status: 1 });
enrollmentWaitlistSchema.index(
  { institutionId: 1, studentId: 1, courseId: 1 },
  { unique: true, partialFilterExpression: { status: 'waiting' } },
);

export type EnrollmentWaitlistDocument = InferSchemaType<typeof enrollmentWaitlistSchema> & {
  _id: Types.ObjectId;
};

export const EnrollmentWaitlistModel = model('EnrollmentWaitlist', enrollmentWaitlistSchema);
