import { Types } from 'mongoose';
import type { EnrollmentListQuery } from '@learnova/validation';
import type { EnrollmentStatus } from '@learnova/types';
import { EnrollmentModel, type EnrollmentDocument } from '../../models/enrollment.model.js';
import {
  EnrollmentWaitlistModel,
  type EnrollmentWaitlistDocument,
} from '../../models/enrollment-waitlist.model.js';
import {
  EnrollmentAuditLogModel,
  type EnrollmentAuditEvent,
} from '../../models/enrollment-audit-log.model.js';

export interface EnrollmentListResult {
  items: EnrollmentDocument[];
  total: number;
  page: number;
  limit: number;
}

export interface EnrollmentStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  active: number;
  completed: number;
  withdrawn: number;
  dropped: number;
  expired: number;
  waitlisted: number;
  byDepartment: Array<{ departmentId: string | null; label: string; count: number }>;
  byCourse: Array<{ courseId: string; courseCode: string; title: string; count: number }>;
  byStatus: Array<{ status: EnrollmentStatus; count: number }>;
  trend: Array<{ date: string; count: number }>;
  recent: Array<{
    id: string;
    enrollmentNumber: string;
    studentId: string;
    courseId: string;
    status: EnrollmentStatus;
    enrollmentDate: string;
  }>;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toObjectId(id: string) {
  return new Types.ObjectId(id);
}

export class EnrollmentRepository {
  buildFilter(institutionId: string, query: EnrollmentListQuery): Record<string, unknown> {
    const filter: Record<string, unknown> = { institutionId: toObjectId(institutionId) };

    if (!query.includeDeleted) {
      filter.deletedAt = null;
    }
    if (query.status) filter.status = query.status;
    if (query.studentId) filter.studentId = toObjectId(query.studentId);
    if (query.courseId) filter.courseId = toObjectId(query.courseId);
    if (query.facultyId) filter.facultyId = toObjectId(query.facultyId);
    if (query.departmentId) filter.departmentId = toObjectId(query.departmentId);
    if (query.programId) filter.programId = toObjectId(query.programId);
    if (query.academicYearId) filter.academicYearId = toObjectId(query.academicYearId);
    if (query.semesterId) filter.semesterId = toObjectId(query.semesterId);
    if (query.sectionId) filter.sectionId = toObjectId(query.sectionId);
    if (query.enrollmentMethod) filter.enrollmentMethod = query.enrollmentMethod;
    if (query.approvalStatus) filter.approvalStatus = query.approvalStatus;
    if (query.completionStatus) filter.completionStatus = query.completionStatus;

    if (query.q) {
      const regex = new RegExp(escapeRegex(query.q), 'i');
      filter.$or = [{ notes: regex }, { enrollmentNumber: regex }];
    }

    return filter;
  }

  async list(institutionId: string, query: EnrollmentListQuery): Promise<EnrollmentListResult> {
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
    sortBy?: EnrollmentListQuery['sortBy'],
    sortOrder?: EnrollmentListQuery['sortOrder'],
  ): Promise<EnrollmentListResult> {
    const sortField = sortBy ?? 'createdAt';
    const sortDir = sortOrder === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      EnrollmentModel.find(filter)
        .sort({ [sortField]: sortDir })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      EnrollmentModel.countDocuments(filter).exec(),
    ]);

    return { items, total, page, limit };
  }

  async findById(institutionId: string, id: string): Promise<EnrollmentDocument | null> {
    return EnrollmentModel.findOne({
      _id: id,
      institutionId: toObjectId(institutionId),
      deletedAt: null,
    }).exec();
  }

  async findByIdIncludingDeleted(
    institutionId: string,
    id: string,
  ): Promise<EnrollmentDocument | null> {
    return EnrollmentModel.findOne({
      _id: id,
      institutionId: toObjectId(institutionId),
    }).exec();
  }

  async findActiveByStudentCourse(
    institutionId: string,
    studentId: string,
    courseId: string,
  ): Promise<EnrollmentDocument | null> {
    return EnrollmentModel.findOne({
      institutionId: toObjectId(institutionId),
      studentId: toObjectId(studentId),
      courseId: toObjectId(courseId),
      deletedAt: null,
    }).exec();
  }

  async create(data: Record<string, unknown>): Promise<EnrollmentDocument> {
    return EnrollmentModel.create(data);
  }

  async updateById(
    institutionId: string,
    id: string,
    data: Record<string, unknown>,
  ): Promise<EnrollmentDocument | null> {
    return EnrollmentModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId), deletedAt: null },
      { $set: data },
      { new: true },
    ).exec();
  }

  async softDelete(institutionId: string, id: string): Promise<EnrollmentDocument | null> {
    return EnrollmentModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId), deletedAt: null },
      {
        $set: {
          deletedAt: new Date(),
        },
      },
      { new: true },
    ).exec();
  }

  async restore(institutionId: string, id: string): Promise<EnrollmentDocument | null> {
    return EnrollmentModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId), deletedAt: { $ne: null } },
      {
        $set: {
          deletedAt: null,
          status: 'active',
        },
      },
      { new: true },
    ).exec();
  }

  async hardDelete(institutionId: string, id: string): Promise<boolean> {
    const res = await EnrollmentModel.deleteOne({
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
    const res = await EnrollmentModel.updateMany(
      {
        _id: { $in: ids },
        institutionId: toObjectId(institutionId),
        deletedAt: null,
      },
      {
        $set: { status },
      },
    ).exec();
    return res.modifiedCount;
  }

  async bulkArchive(institutionId: string, ids: string[]): Promise<number> {
    const res = await EnrollmentModel.updateMany(
      {
        _id: { $in: ids },
        institutionId: toObjectId(institutionId),
        deletedAt: null,
      },
      { $set: { deletedAt: new Date() } },
    ).exec();
    return res.modifiedCount;
  }

  async bulkAssignFaculty(
    institutionId: string,
    ids: string[],
    facultyId: string | null,
  ): Promise<number> {
    const res = await EnrollmentModel.updateMany(
      {
        _id: { $in: ids },
        institutionId: toObjectId(institutionId),
        deletedAt: null,
      },
      { $set: { facultyId: facultyId ? toObjectId(facultyId) : null } },
    ).exec();
    return res.modifiedCount;
  }

  async countActiveEnrollments(institutionId: string, courseId: string): Promise<number> {
    return EnrollmentModel.countDocuments({
      institutionId: toObjectId(institutionId),
      courseId: toObjectId(courseId),
      status: { $in: ['active', 'approved', 'pending'] },
      deletedAt: null,
    }).exec();
  }

  async waitlistJoin(
    institutionId: string,
    studentId: string,
    courseId: string,
  ): Promise<EnrollmentWaitlistDocument> {
    const maxPosition = await EnrollmentWaitlistModel.findOne({
      institutionId: toObjectId(institutionId),
      courseId: toObjectId(courseId),
      status: 'waiting',
    })
      .sort({ position: -1 })
      .select('position')
      .exec();

    const nextPosition = maxPosition ? maxPosition.position + 1 : 1;

    return EnrollmentWaitlistModel.create({
      institutionId: toObjectId(institutionId),
      studentId: toObjectId(studentId),
      courseId: toObjectId(courseId),
      position: nextPosition,
      status: 'waiting',
      joinedAt: new Date(),
    });
  }

  async waitlistLeave(
    institutionId: string,
    studentId: string,
    courseId: string,
  ): Promise<boolean> {
    const res = await EnrollmentWaitlistModel.updateOne(
      {
        institutionId: toObjectId(institutionId),
        studentId: toObjectId(studentId),
        courseId: toObjectId(courseId),
        status: 'waiting',
      },
      { $set: { status: 'left' } },
    ).exec();
    return res.modifiedCount > 0;
  }

  async waitlistList(
    institutionId: string,
    courseId: string,
  ): Promise<EnrollmentWaitlistDocument[]> {
    return EnrollmentWaitlistModel.find({
      institutionId: toObjectId(institutionId),
      courseId: toObjectId(courseId),
      status: 'waiting',
    })
      .sort({ position: 1 })
      .exec();
  }

  async waitlistPromoteNext(
    institutionId: string,
    courseId: string,
  ): Promise<EnrollmentWaitlistDocument | null> {
    const next = await EnrollmentWaitlistModel.findOneAndUpdate(
      {
        institutionId: toObjectId(institutionId),
        courseId: toObjectId(courseId),
        status: 'waiting',
      },
      { $set: { status: 'promoted', promotedAt: new Date() } },
      { sort: { position: 1 }, new: true },
    ).exec();

    return next;
  }

  async getStats(institutionId: string): Promise<EnrollmentStats> {
    const oid = toObjectId(institutionId);
    const trendStart = new Date();
    trendStart.setDate(trendStart.getDate() - 29);
    trendStart.setHours(0, 0, 0, 0);

    const [
      total,
      pending,
      approved,
      rejected,
      active,
      completed,
      withdrawn,
      dropped,
      expired,
      waitlisted,
      byDepartmentRaw,
      byCourseRaw,
      byStatusRaw,
      trendRaw,
      recentDocs,
    ] = await Promise.all([
      EnrollmentModel.countDocuments({ institutionId: oid, deletedAt: null }),
      EnrollmentModel.countDocuments({ institutionId: oid, deletedAt: null, status: 'pending' }),
      EnrollmentModel.countDocuments({
        institutionId: oid,
        deletedAt: null,
        status: 'approved',
      }),
      EnrollmentModel.countDocuments({
        institutionId: oid,
        deletedAt: null,
        status: 'rejected',
      }),
      EnrollmentModel.countDocuments({ institutionId: oid, deletedAt: null, status: 'active' }),
      EnrollmentModel.countDocuments({
        institutionId: oid,
        deletedAt: null,
        status: 'completed',
      }),
      EnrollmentModel.countDocuments({
        institutionId: oid,
        deletedAt: null,
        status: 'withdrawn',
      }),
      EnrollmentModel.countDocuments({ institutionId: oid, deletedAt: null, status: 'dropped' }),
      EnrollmentModel.countDocuments({ institutionId: oid, deletedAt: null, status: 'expired' }),
      EnrollmentWaitlistModel.countDocuments({
        institutionId: oid,
        status: 'waiting',
      }),
      EnrollmentModel.aggregate([
        { $match: { institutionId: oid, deletedAt: null } },
        { $group: { _id: '$departmentId', count: { $sum: 1 } } },
        {
          $lookup: {
            from: 'departments',
            localField: '_id',
            foreignField: '_id',
            as: 'department',
          },
        },
        {
          $project: {
            departmentId: {
              $cond: [{ $eq: ['$_id', null] }, null, { $toString: '$_id' }],
            },
            label: {
              $ifNull: [{ $arrayElemAt: ['$department.name', 0] }, 'Unassigned'],
            },
            count: 1,
          },
        },
        { $sort: { count: -1 } },
      ]),
      EnrollmentModel.aggregate([
        { $match: { institutionId: oid, deletedAt: null } },
        { $group: { _id: '$courseId', count: { $sum: 1 } } },
        {
          $lookup: {
            from: 'courses',
            localField: '_id',
            foreignField: '_id',
            as: 'course',
          },
        },
        {
          $project: {
            courseId: { $toString: '$_id' },
            courseCode: {
              $ifNull: [{ $arrayElemAt: ['$course.courseCode', 0] }, ''],
            },
            title: {
              $ifNull: [{ $arrayElemAt: ['$course.title', 0] }, 'Unknown'],
            },
            count: 1,
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      EnrollmentModel.aggregate([
        { $match: { institutionId: oid, deletedAt: null } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      EnrollmentModel.aggregate([
        {
          $match: {
            institutionId: oid,
            deletedAt: null,
            createdAt: { $gte: trendStart },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      EnrollmentModel.find({ institutionId: oid, deletedAt: null })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('enrollmentNumber studentId courseId status enrollmentDate')
        .exec(),
    ]);

    const byStatus = byStatusRaw.map((row) => ({
      status: row._id as EnrollmentStatus,
      count: row.count as number,
    }));

    const trend = trendRaw.map((row) => ({
      date: row._id as string,
      count: row.count as number,
    }));

    const recent = recentDocs.map((doc) => ({
      id: String(doc._id),
      enrollmentNumber: doc.enrollmentNumber,
      studentId: String(doc.studentId),
      courseId: String(doc.courseId),
      status: doc.status as EnrollmentStatus,
      enrollmentDate:
        doc.enrollmentDate instanceof Date
          ? doc.enrollmentDate.toISOString()
          : String(doc.enrollmentDate),
    }));

    return {
      total,
      pending,
      approved,
      rejected,
      active,
      completed,
      withdrawn,
      dropped,
      expired,
      waitlisted,
      byDepartment: byDepartmentRaw as EnrollmentStats['byDepartment'],
      byCourse: byCourseRaw as EnrollmentStats['byCourse'],
      byStatus,
      trend,
      recent,
    };
  }

  async listAudit(institutionId: string, enrollmentId?: string, limit = 50) {
    const filter: Record<string, unknown> = { institutionId: toObjectId(institutionId) };
    if (enrollmentId) filter.enrollmentId = toObjectId(enrollmentId);
    return EnrollmentAuditLogModel.find(filter).sort({ createdAt: -1 }).limit(limit).exec();
  }

  async logAudit(input: {
    event: EnrollmentAuditEvent;
    institutionId: string;
    enrollmentId?: string | null;
    studentId?: string | null;
    courseId?: string | null;
    userId?: string | null;
    email?: string | null;
    metadata?: Record<string, unknown>;
  }) {
    return EnrollmentAuditLogModel.create({
      event: input.event,
      institutionId: toObjectId(input.institutionId),
      enrollmentId: input.enrollmentId ? toObjectId(input.enrollmentId) : null,
      studentId: input.studentId ? toObjectId(input.studentId) : null,
      courseId: input.courseId ? toObjectId(input.courseId) : null,
      userId: input.userId ? toObjectId(input.userId) : null,
      email: input.email ?? null,
      metadata: input.metadata ?? {},
    });
  }
}

export const enrollmentRepository = new EnrollmentRepository();
