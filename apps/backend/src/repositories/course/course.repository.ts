import { Types } from 'mongoose';
import type { CourseListQuery } from '@learnova/validation';
import { CourseModel, type CourseDocument } from '../../models/course.model.js';
import {
  CourseAuditLogModel,
  type CourseAuditEvent,
} from '../../models/course-audit-log.model.js';

export interface CourseListResult {
  items: CourseDocument[];
  total: number;
  page: number;
  limit: number;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toObjectId(id: string) {
  return new Types.ObjectId(id);
}

export class CourseRepository {
  buildFilter(institutionId: string, query: CourseListQuery): Record<string, unknown> {
    const filter: Record<string, unknown> = { institutionId: toObjectId(institutionId) };

    if (!query.includeDeleted) {
      filter.deletedAt = null;
    }
    if (query.status) filter.status = query.status;
    if (query.visibility) filter.visibility = query.visibility;
    if (query.difficulty) filter.difficulty = query.difficulty;
    if (query.category) filter.category = query.category;
    if (query.language) filter.language = query.language;
    if (query.campusId) filter.campusId = toObjectId(query.campusId);
    if (query.schoolId) filter.schoolId = toObjectId(query.schoolId);
    if (query.departmentId) filter.departmentId = toObjectId(query.departmentId);
    if (query.programId) filter.programIds = toObjectId(query.programId);
    if (query.semesterId) filter.semesterIds = toObjectId(query.semesterId);
    if (query.facultyId) filter.facultyIds = toObjectId(query.facultyId);

    if (query.creditsMin !== undefined || query.creditsMax !== undefined) {
      const credits: Record<string, number> = {};
      if (query.creditsMin !== undefined) credits.$gte = query.creditsMin;
      if (query.creditsMax !== undefined) credits.$lte = query.creditsMax;
      filter.credits = credits;
    }

    if (query.q) {
      const regex = new RegExp(escapeRegex(query.q), 'i');
      filter.$or = [
        { title: regex },
        { courseCode: regex },
        { subtitle: regex },
        { description: regex },
        { shortDescription: regex },
        { tags: regex },
        { skills: regex },
      ];
    }

    return filter;
  }

  async list(institutionId: string, query: CourseListQuery): Promise<CourseListResult> {
    const filter = this.buildFilter(institutionId, query);
    return this.listByFilter(
      filter,
      query.page,
      query.limit,
      query.sortBy,
      query.sortOrder,
    );
  }

  async listByFilter(
    filter: Record<string, unknown>,
    page: number,
    limit: number,
    sortBy?: CourseListQuery['sortBy'],
    sortOrder?: CourseListQuery['sortOrder'],
  ): Promise<CourseListResult> {
    const sortField = sortBy ?? 'createdAt';
    const sortDir = sortOrder === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      CourseModel.find(filter)
        .sort({ [sortField]: sortDir })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      CourseModel.countDocuments(filter).exec(),
    ]);

    return { items, total, page, limit };
  }

  async findById(institutionId: string, id: string): Promise<CourseDocument | null> {
    return CourseModel.findOne({
      _id: id,
      institutionId: toObjectId(institutionId),
      deletedAt: null,
    }).exec();
  }

  async findByIdIncludingDeleted(
    institutionId: string,
    id: string,
  ): Promise<CourseDocument | null> {
    return CourseModel.findOne({
      _id: id,
      institutionId: toObjectId(institutionId),
    }).exec();
  }

  async findDuplicates(
    institutionId: string,
    keys: { courseCode?: string; slug?: string },
  ): Promise<CourseDocument[]> {
    const or: Record<string, unknown>[] = [];
    if (keys.courseCode) or.push({ courseCode: keys.courseCode.toUpperCase() });
    if (keys.slug) or.push({ slug: keys.slug.toLowerCase() });
    if (or.length === 0) return [];
    return CourseModel.find({
      institutionId: toObjectId(institutionId),
      deletedAt: null,
      $or: or,
    }).exec();
  }

  async create(data: Record<string, unknown>): Promise<CourseDocument> {
    return CourseModel.create(data);
  }

  async updateById(
    institutionId: string,
    id: string,
    data: Record<string, unknown>,
  ): Promise<CourseDocument | null> {
    return CourseModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId), deletedAt: null },
      { $set: data },
      { new: true },
    ).exec();
  }

  async softDelete(institutionId: string, id: string): Promise<CourseDocument | null> {
    return CourseModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId), deletedAt: null },
      {
        $set: {
          deletedAt: new Date(),
          status: 'archived',
        },
      },
      { new: true },
    ).exec();
  }

  async restore(institutionId: string, id: string): Promise<CourseDocument | null> {
    return CourseModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId), deletedAt: { $ne: null } },
      {
        $set: {
          deletedAt: null,
          status: 'draft',
        },
      },
      { new: true },
    ).exec();
  }

  async hardDelete(institutionId: string, id: string): Promise<boolean> {
    const res = await CourseModel.deleteOne({
      _id: id,
      institutionId: toObjectId(institutionId),
    }).exec();
    return res.deletedCount > 0;
  }

  async bulkUpdateStatus(
    institutionId: string,
    ids: string[],
    status: string,
  ): Promise<number> {
    const res = await CourseModel.updateMany(
      {
        _id: { $in: ids },
        institutionId: toObjectId(institutionId),
        deletedAt: null,
      },
      {
        $set: {
          status,
          ...(status === 'published' ? { publishDate: new Date() } : {}),
          ...(status === 'archived' ? { archiveDate: new Date() } : {}),
        },
      },
    ).exec();
    return res.modifiedCount;
  }

  async bulkArchive(institutionId: string, ids: string[]): Promise<number> {
    const res = await CourseModel.updateMany(
      {
        _id: { $in: ids },
        institutionId: toObjectId(institutionId),
        deletedAt: null,
      },
      { $set: { deletedAt: new Date(), status: 'archived', archiveDate: new Date() } },
    ).exec();
    return res.modifiedCount;
  }

  async bulkAssignFaculty(
    institutionId: string,
    ids: string[],
    facultyIds: string[],
    mode: 'replace' | 'append',
    coordinatorId?: string | null,
  ): Promise<number> {
    const oidFaculty = facultyIds.map(toObjectId);
    const $set: Record<string, unknown> = {};
    if (coordinatorId !== undefined) {
      $set.coordinatorId = coordinatorId ? toObjectId(coordinatorId) : null;
    }

    if (mode === 'replace') {
      $set.facultyIds = oidFaculty;
      const res = await CourseModel.updateMany(
        {
          _id: { $in: ids },
          institutionId: toObjectId(institutionId),
          deletedAt: null,
        },
        { $set },
      ).exec();
      return res.modifiedCount;
    }
    const res = await CourseModel.updateMany(
      {
        _id: { $in: ids },
        institutionId: toObjectId(institutionId),
        deletedAt: null,
      },
      {
        ...(Object.keys($set).length > 0 ? { $set } : {}),
        $addToSet: { facultyIds: { $each: oidFaculty } },
      },
    ).exec();
    return res.modifiedCount;
  }

  async bulkAssignPrograms(
    institutionId: string,
    ids: string[],
    programIds: string[],
    mode: 'replace' | 'append',
  ): Promise<number> {
    const oidPrograms = programIds.map(toObjectId);
    if (mode === 'replace') {
      const res = await CourseModel.updateMany(
        {
          _id: { $in: ids },
          institutionId: toObjectId(institutionId),
          deletedAt: null,
        },
        { $set: { programIds: oidPrograms } },
      ).exec();
      return res.modifiedCount;
    }
    const res = await CourseModel.updateMany(
      {
        _id: { $in: ids },
        institutionId: toObjectId(institutionId),
        deletedAt: null,
      },
      { $addToSet: { programIds: { $each: oidPrograms } } },
    ).exec();
    return res.modifiedCount;
  }

  async bulkAssignSemesters(
    institutionId: string,
    ids: string[],
    semesterIds: string[],
    mode: 'replace' | 'append',
  ): Promise<number> {
    const oidSemesters = semesterIds.map(toObjectId);
    if (mode === 'replace') {
      const res = await CourseModel.updateMany(
        {
          _id: { $in: ids },
          institutionId: toObjectId(institutionId),
          deletedAt: null,
        },
        { $set: { semesterIds: oidSemesters } },
      ).exec();
      return res.modifiedCount;
    }
    const res = await CourseModel.updateMany(
      {
        _id: { $in: ids },
        institutionId: toObjectId(institutionId),
        deletedAt: null,
      },
      { $addToSet: { semesterIds: { $each: oidSemesters } } },
    ).exec();
    return res.modifiedCount;
  }

  async getStats(institutionId: string) {
    const oid = toObjectId(institutionId);

    const [
      total,
      published,
      draft,
      review,
      archived,
      scheduled,
      facultyAssigned,
      programsDistinct,
      departmentsDistinct,
      byDepartment,
      byCategory,
      byDifficulty,
      recentCourses,
      avgCredits,
      avgHours,
    ] = await Promise.all([
      CourseModel.countDocuments({ institutionId: oid, deletedAt: null }),
      CourseModel.countDocuments({ institutionId: oid, deletedAt: null, status: 'published' }),
      CourseModel.countDocuments({ institutionId: oid, deletedAt: null, status: 'draft' }),
      CourseModel.countDocuments({ institutionId: oid, deletedAt: null, status: 'review' }),
      CourseModel.countDocuments({ institutionId: oid, status: 'archived' }),
      CourseModel.countDocuments({ institutionId: oid, deletedAt: null, status: 'scheduled' }),
      CourseModel.countDocuments({
        institutionId: oid,
        deletedAt: null,
        facultyIds: { $exists: true, $ne: [] },
      }),
      CourseModel.distinct('programIds', { institutionId: oid, deletedAt: null }),
      CourseModel.distinct('departmentId', { institutionId: oid, deletedAt: null }),
      CourseModel.aggregate([
        { $match: { institutionId: oid, deletedAt: null } },
        { $group: { _id: '$departmentId', count: { $sum: 1 } } },
      ]),
      CourseModel.aggregate([
        { $match: { institutionId: oid, deletedAt: null } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),
      CourseModel.aggregate([
        { $match: { institutionId: oid, deletedAt: null } },
        { $group: { _id: '$difficulty', count: { $sum: 1 } } },
      ]),
      CourseModel.find({ institutionId: oid, deletedAt: null })
        .sort({ updatedAt: -1 })
        .limit(6)
        .select('title courseCode status updatedAt')
        .exec(),
      CourseModel.aggregate([
        { $match: { institutionId: oid, deletedAt: null } },
        { $group: { _id: null, avg: { $avg: '$credits' } } },
      ]),
      CourseModel.aggregate([
        {
          $match: {
            institutionId: oid,
            deletedAt: null,
            estimatedHours: { $exists: true, $ne: null },
          },
        },
        { $group: { _id: null, avg: { $avg: '$estimatedHours' } } },
      ]),
    ]);

    const totalCredits = avgCredits[0]?.avg ? Math.round(avgCredits[0].avg * total) : 0;
    const averageDurationHours = avgHours[0]?.avg ? Math.round(avgHours[0].avg) : 0;

    return {
      total,
      published,
      draft,
      review,
      archived,
      scheduled,
      facultyAssigned,
      programs: programsDistinct.length,
      departments: departmentsDistinct.length,
      averageDurationHours,
      totalCredits,
      byDepartment,
      byCategory,
      byDifficulty,
      recent: recentCourses,
    };
  }

  async listAudit(institutionId: string, courseId?: string, limit = 50) {
    const filter: Record<string, unknown> = { institutionId: toObjectId(institutionId) };
    if (courseId) filter.courseId = toObjectId(courseId);
    return CourseAuditLogModel.find(filter).sort({ createdAt: -1 }).limit(limit).exec();
  }

  async logAudit(input: {
    event: CourseAuditEvent;
    institutionId: string;
    courseId?: string | null;
    userId?: string | null;
    email?: string | null;
    metadata?: Record<string, unknown>;
  }) {
    return CourseAuditLogModel.create({
      event: input.event,
      institutionId: toObjectId(input.institutionId),
      courseId: input.courseId ? toObjectId(input.courseId) : null,
      userId: input.userId ? toObjectId(input.userId) : null,
      email: input.email ?? null,
      metadata: input.metadata ?? {},
    });
  }
}

export const courseRepository = new CourseRepository();
