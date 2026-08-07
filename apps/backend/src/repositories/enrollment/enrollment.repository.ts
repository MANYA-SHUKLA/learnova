import { Types } from 'mongoose';
import type { EnrollmentListQuery } from '@learnova/validation';
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
  active: number;
  pending: number;
  approved: number;
  rejected: number;
  withdrawn: number;
  completed: number;
  dropped: number;
  suspended: number;
  archived: number;
  newThisMonth: number;
  byStatus: Array<{ _id: string; count: number }>;
  byEnrollmentMethod: Array<{ _id: string; count: number }>;
  byCourse: Array<{ _id: Types.ObjectId; count: number }>;
  byProgram: Array<{ _id: Types.ObjectId; count: number }>;
  recentEnrollments: EnrollmentDocument[];
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
      filter.$or = [{ notes: regex }, { grade: regex }, { rejectionReason: regex }];
    }

    return filter;
  }

  async list(institutionId: string, query: EnrollmentListQuery): Promise<EnrollmentListResult> {
    const filter = this.buildFilter(institutionId, query);
    const page = query.page;
    const limit = query.limit;
    const sortField = query.sortBy ?? 'createdAt';
    const sortDir = query.sortOrder === 'asc' ? 1 : -1;

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
          status: 'archived',
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
        $set: {
          status,
          ...(status === 'archived' ? { deletedAt: new Date() } : {}),
        },
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
      { $set: { deletedAt: new Date(), status: 'archived' } },
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
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      total,
      active,
      pending,
      approved,
      rejected,
      withdrawn,
      completed,
      dropped,
      suspended,
      archived,
      newThisMonth,
      byStatus,
      byEnrollmentMethod,
      byCourse,
      byProgram,
      recentEnrollments,
    ] = await Promise.all([
      EnrollmentModel.countDocuments({ institutionId: oid, deletedAt: null }),
      EnrollmentModel.countDocuments({ institutionId: oid, deletedAt: null, status: 'active' }),
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
      EnrollmentModel.countDocuments({
        institutionId: oid,
        deletedAt: null,
        status: 'withdrawn',
      }),
      EnrollmentModel.countDocuments({
        institutionId: oid,
        deletedAt: null,
        status: 'completed',
      }),
      EnrollmentModel.countDocuments({ institutionId: oid, deletedAt: null, status: 'dropped' }),
      EnrollmentModel.countDocuments({
        institutionId: oid,
        deletedAt: null,
        status: 'suspended',
      }),
      EnrollmentModel.countDocuments({ institutionId: oid, status: 'archived' }),
      EnrollmentModel.countDocuments({
        institutionId: oid,
        deletedAt: null,
        createdAt: { $gte: startOfMonth },
      }),
      EnrollmentModel.aggregate([
        { $match: { institutionId: oid, deletedAt: null } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      EnrollmentModel.aggregate([
        { $match: { institutionId: oid, deletedAt: null } },
        { $group: { _id: '$enrollmentMethod', count: { $sum: 1 } } },
      ]),
      EnrollmentModel.aggregate([
        { $match: { institutionId: oid, deletedAt: null } },
        { $group: { _id: '$courseId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      EnrollmentModel.aggregate([
        { $match: { institutionId: oid, deletedAt: null, programId: { $ne: null } } },
        { $group: { _id: '$programId', count: { $sum: 1 } } },
      ]),
      EnrollmentModel.find({ institutionId: oid, deletedAt: null })
        .sort({ createdAt: -1 })
        .limit(10)
        .exec(),
    ]);

    return {
      total,
      active,
      pending,
      approved,
      rejected,
      withdrawn,
      completed,
      dropped,
      suspended,
      archived,
      newThisMonth,
      byStatus,
      byEnrollmentMethod,
      byCourse,
      byProgram,
      recentEnrollments,
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
