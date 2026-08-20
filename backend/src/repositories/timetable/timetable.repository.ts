import { Types } from 'mongoose';
import { TimetableModel, TimetableSlotModel } from '../../models/index.js';
import { timetableSlotToDto, timetableToDto } from './timetable.mapper.js';

export const timetableRepository = {
  async findByInstitutionSemester(institutionId: string, semesterId: string) {
    return TimetableModel.findOne({
      institutionId: new Types.ObjectId(institutionId),
      semesterId: new Types.ObjectId(semesterId),
      deletedAt: null,
    }).exec();
  },

  async findById(id: string, institutionId: string) {
    return TimetableModel.findOne({
      _id: new Types.ObjectId(id),
      institutionId: new Types.ObjectId(institutionId),
      deletedAt: null,
    }).exec();
  },

  async list(institutionId: string, filters: { semesterId?: string; status?: string; skip: number; limit: number }) {
    const query: Record<string, unknown> = {
      institutionId: new Types.ObjectId(institutionId),
      deletedAt: null,
    };
    if (filters.semesterId) query.semesterId = new Types.ObjectId(filters.semesterId);
    if (filters.status) query.status = filters.status;

    const [docs, total] = await Promise.all([
      TimetableModel.find(query).sort({ updatedAt: -1 }).skip(filters.skip).limit(filters.limit).exec(),
      TimetableModel.countDocuments(query).exec(),
    ]);
    return { docs, total };
  },

  async create(data: {
    institutionId: string;
    semesterId: string;
    academicYearId: string;
    name: string;
  }) {
    return TimetableModel.create({
      institutionId: new Types.ObjectId(data.institutionId),
      semesterId: new Types.ObjectId(data.semesterId),
      academicYearId: new Types.ObjectId(data.academicYearId),
      name: data.name,
      status: 'draft',
    });
  },

  async publish(id: string, institutionId: string) {
    return TimetableModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), institutionId: new Types.ObjectId(institutionId), deletedAt: null },
      { status: 'published', publishedAt: new Date() },
      { new: true },
    ).exec();
  },

  async countSlots(timetableId: string) {
    return TimetableSlotModel.countDocuments({
      timetableId: new Types.ObjectId(timetableId),
      deletedAt: null,
    }).exec();
  },

  async listSlots(
    timetableId: string,
    institutionId: string,
    filters: {
      dayOfWeek?: string;
      sectionId?: string;
      facultyId?: string;
      courseId?: string;
      status?: string;
      skip: number;
      limit: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    },
  ) {
    const query: Record<string, unknown> = {
      timetableId: new Types.ObjectId(timetableId),
      institutionId: new Types.ObjectId(institutionId),
      deletedAt: null,
    };
    if (filters.dayOfWeek) query.dayOfWeek = filters.dayOfWeek;
    if (filters.sectionId) query.sectionId = new Types.ObjectId(filters.sectionId);
    if (filters.facultyId) query.facultyId = new Types.ObjectId(filters.facultyId);
    if (filters.courseId) query.courseId = new Types.ObjectId(filters.courseId);
    if (filters.status) query.status = filters.status;

    const sortField = filters.sortBy ?? 'dayOfWeek';
    const sortDir = filters.sortOrder === 'desc' ? -1 : 1;
    const sort: Record<string, 1 | -1> =
      sortField === 'startTime'
        ? { dayOfWeek: sortDir, startTime: sortDir }
        : { [sortField]: sortDir, startTime: 1 };

    const [docs, total] = await Promise.all([
      TimetableSlotModel.find(query).sort(sort).skip(filters.skip).limit(filters.limit).exec(),
      TimetableSlotModel.countDocuments(query).exec(),
    ]);
    return { docs, total };
  },

  async findSlotById(id: string, institutionId: string) {
    return TimetableSlotModel.findOne({
      _id: new Types.ObjectId(id),
      institutionId: new Types.ObjectId(institutionId),
      deletedAt: null,
    }).exec();
  },

  async findSlotsForConflictCheck(
    institutionId: string,
    sectionId: string,
    dayOfWeek: string,
    excludeSlotId?: string,
  ) {
    const query: Record<string, unknown> = {
      institutionId: new Types.ObjectId(institutionId),
      sectionId: new Types.ObjectId(sectionId),
      dayOfWeek,
      status: 'active',
      deletedAt: null,
    };
    if (excludeSlotId) query._id = { $ne: new Types.ObjectId(excludeSlotId) };
    return TimetableSlotModel.find(query).select('startTime endTime').lean().exec();
  },

  async createSlot(data: Record<string, unknown>) {
    return TimetableSlotModel.create(data);
  },

  async updateSlot(id: string, institutionId: string, data: Record<string, unknown>) {
    return TimetableSlotModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), institutionId: new Types.ObjectId(institutionId), deletedAt: null },
      { $set: data },
      { new: true },
    ).exec();
  },

  async deleteSlot(id: string, institutionId: string) {
    return TimetableSlotModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), institutionId: new Types.ObjectId(institutionId), deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true },
    ).exec();
  },

  async findPublishedSlotsForDay(institutionId: string, dayOfWeek: string) {
    const timetables = await TimetableModel.find({
      institutionId: new Types.ObjectId(institutionId),
      status: 'published',
      deletedAt: null,
    })
      .select('_id')
      .lean()
      .exec();
    const timetableIds = timetables.map((t) => t._id);
    if (timetableIds.length === 0) return [];

    return TimetableSlotModel.find({
      institutionId: new Types.ObjectId(institutionId),
      timetableId: { $in: timetableIds },
      dayOfWeek,
      status: 'active',
      deletedAt: null,
    })
      .sort({ startTime: 1 })
      .exec();
  },

  toDto: timetableToDto,
  slotToDto: timetableSlotToDto,
};
