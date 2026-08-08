import { Types } from 'mongoose';
import type { NotificationListQuery } from '@learnova/validation';
import { NotificationModel } from '../../models/notification.model.js';
import { CourseAnnouncementModel } from '../../models/course-announcement.model.js';

function oid(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}

export function toDto(doc: {
  _id: Types.ObjectId;
  toObject?: () => Record<string, unknown>;
}): Record<string, unknown> {
  const raw =
    typeof doc.toObject === 'function'
      ? doc.toObject()
      : (doc as unknown as Record<string, unknown>);
  const { _id, __v, ...rest } = raw as Record<string, unknown> & {
    _id: Types.ObjectId;
    __v?: number;
  };
  return { id: String(_id), ...rest };
}

export function pageMeta(total: number, page: number, limit: number) {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

export const notificationRepository = {
  async create(payload: Record<string, unknown>) {
    try {
      return await NotificationModel.create(payload);
    } catch (err) {
      if ((err as { code?: number }).code === 11000) return null;
      throw err;
    }
  },

  async list(userId: string, query: NotificationListQuery) {
    const filter: Record<string, unknown> = {
      userId: oid(userId),
      deletedAt: null,
    };
    if (query.unreadOnly) filter.read = false;
    if (query.q) {
      filter.$text = { $search: query.q };
    }

    const skip = (query.page - 1) * query.limit;
    const [items, total, unreadCount] = await Promise.all([
      NotificationModel.find(filter)
        .sort(query.q ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
        .skip(skip)
        .limit(query.limit)
        .exec(),
      NotificationModel.countDocuments(filter).exec(),
      NotificationModel.countDocuments({ userId: oid(userId), deletedAt: null, read: false }).exec(),
    ]);

    return { items, total, unreadCount };
  },

  async markRead(userId: string, notificationId: string) {
    return NotificationModel.findOneAndUpdate(
      { _id: oid(notificationId), userId: oid(userId), deletedAt: null },
      { $set: { read: true, readAt: new Date() } },
      { new: true },
    ).exec();
  },

  async markAllRead(userId: string) {
    const result = await NotificationModel.updateMany(
      { userId: oid(userId), deletedAt: null, read: false },
      { $set: { read: true, readAt: new Date() } },
    ).exec();
    return result.modifiedCount;
  },

  async softDelete(userId: string, notificationId: string) {
    return NotificationModel.findOneAndUpdate(
      { _id: oid(notificationId), userId: oid(userId), deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true },
    ).exec();
  },

  async unreadCount(userId: string) {
    return NotificationModel.countDocuments({
      userId: oid(userId),
      deletedAt: null,
      read: false,
    }).exec();
  },

  async createAnnouncement(payload: Record<string, unknown>) {
    return CourseAnnouncementModel.create(payload);
  },
};
