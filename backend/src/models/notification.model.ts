import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { NOTIFICATION_TYPES } from '@learnova/constants';

const notificationSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 300 },
    body: { type: String, required: true, trim: true, maxlength: 5000 },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
    data: { type: Schema.Types.Mixed, default: {} },
    dedupeKey: { type: String, default: null, index: true },
    emailSent: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: 'notifications' },
);

notificationSchema.index({ userId: 1, read: 1, deletedAt: 1, createdAt: -1 });
notificationSchema.index(
  { userId: 1, dedupeKey: 1 },
  { unique: true, partialFilterExpression: { dedupeKey: { $type: 'string' } } },
);
notificationSchema.index({ title: 'text', body: 'text' });

export type NotificationDocument = InferSchemaType<typeof notificationSchema> & {
  _id: Types.ObjectId;
};

export const NotificationModel = model('Notification', notificationSchema);
