import type { FilterQuery, SortOrder } from 'mongoose';
import type { FacultyListQuery } from '@learnova/validation';
import { FacultyModel, type FacultyDocument } from '../../models/faculty.model.js';
import {
  FacultyAuditLogModel,
  type FacultyAuditEvent,
} from '../../models/faculty-audit-log.model.js';

export interface FacultyListResult {
  items: FacultyDocument[];
  total: number;
  page: number;
  limit: number;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export class FacultyRepository {
  buildFilter(institutionId: string, query: FacultyListQuery): FilterQuery<FacultyDocument> {
    const filter: FilterQuery<FacultyDocument> = { institutionId };

    if (!query.includeDeleted) {
      filter.deletedAt = null;
    }
    if (query.status) filter.status = query.status;
    if (query.campusId) filter.campusId = query.campusId;
    if (query.schoolId) filter.schoolId = query.schoolId;
    if (query.departmentId) filter.departmentId = query.departmentId;
    if (query.programId) filter.programIds = query.programId;
    if (query.designation) filter.designation = query.designation;
    if (query.employmentType) filter.employmentType = query.employmentType;

    if (query.joiningDateFrom || query.joiningDateTo) {
      filter.joiningDate = {};
      if (query.joiningDateFrom) {
        (filter.joiningDate as Record<string, Date>).$gte = query.joiningDateFrom;
      }
      if (query.joiningDateTo) {
        (filter.joiningDate as Record<string, Date>).$lte = query.joiningDateTo;
      }
    }

    if (query.experienceMin !== undefined || query.experienceMax !== undefined) {
      filter.experienceYears = {};
      if (query.experienceMin !== undefined) {
        (filter.experienceYears as Record<string, number>).$gte = query.experienceMin;
      }
      if (query.experienceMax !== undefined) {
        (filter.experienceYears as Record<string, number>).$lte = query.experienceMax;
      }
    }

    if (query.q) {
      const regex = new RegExp(escapeRegex(query.q), 'i');
      filter.$or = [
        { fullName: regex },
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        { employeeId: regex },
        { facultyCode: regex },
        { designation: regex },
        { customDesignation: regex },
        { researchAreas: regex },
      ];
    }

    return filter;
  }

  async list(institutionId: string, query: FacultyListQuery): Promise<FacultyListResult> {
    const filter = this.buildFilter(institutionId, query);
    const page = query.page;
    const limit = query.limit;
    const sortField = query.sortBy ?? 'createdAt';
    const sortDir: SortOrder = query.sortOrder === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      FacultyModel.find(filter)
        .sort({ [sortField]: sortDir })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      FacultyModel.countDocuments(filter).exec(),
    ]);

    return { items, total, page, limit };
  }

  async findById(institutionId: string, id: string): Promise<FacultyDocument | null> {
    return FacultyModel.findOne({ _id: id, institutionId, deletedAt: null }).exec();
  }

  async findByIdIncludingDeleted(
    institutionId: string,
    id: string,
  ): Promise<FacultyDocument | null> {
    return FacultyModel.findOne({ _id: id, institutionId }).exec();
  }

  async findByEmail(institutionId: string, email: string): Promise<FacultyDocument | null> {
    return FacultyModel.findOne({
      institutionId,
      email: email.toLowerCase(),
      deletedAt: null,
    }).exec();
  }

  async findDuplicates(
    institutionId: string,
    keys: { employeeId?: string; facultyCode?: string; email?: string },
  ): Promise<FacultyDocument[]> {
    const or: FilterQuery<FacultyDocument>[] = [];
    if (keys.employeeId) or.push({ employeeId: keys.employeeId });
    if (keys.facultyCode) or.push({ facultyCode: keys.facultyCode.toUpperCase() });
    if (keys.email) or.push({ email: keys.email.toLowerCase() });
    if (or.length === 0) return [];
    return FacultyModel.find({ institutionId, deletedAt: null, $or: or }).exec();
  }

  async create(data: Record<string, unknown>): Promise<FacultyDocument> {
    return FacultyModel.create(data);
  }

  async updateById(
    institutionId: string,
    id: string,
    data: Record<string, unknown>,
  ): Promise<FacultyDocument | null> {
    return FacultyModel.findOneAndUpdate(
      { _id: id, institutionId, deletedAt: null },
      { $set: data },
      { new: true },
    ).exec();
  }

  async softDelete(institutionId: string, id: string): Promise<FacultyDocument | null> {
    return FacultyModel.findOneAndUpdate(
      { _id: id, institutionId, deletedAt: null },
      {
        $set: {
          deletedAt: new Date(),
          status: 'archived',
          isActive: false,
        },
      },
      { new: true },
    ).exec();
  }

  async restore(institutionId: string, id: string): Promise<FacultyDocument | null> {
    return FacultyModel.findOneAndUpdate(
      { _id: id, institutionId, deletedAt: { $ne: null } },
      {
        $set: {
          deletedAt: null,
          status: 'active',
          isActive: true,
        },
      },
      { new: true },
    ).exec();
  }

  async hardDelete(institutionId: string, id: string): Promise<boolean> {
    const res = await FacultyModel.deleteOne({ _id: id, institutionId }).exec();
    return res.deletedCount > 0;
  }

  async bulkUpdateStatus(
    institutionId: string,
    ids: string[],
    status: string,
  ): Promise<number> {
    const isActive = status === 'active' || status === 'on_leave';
    const res = await FacultyModel.updateMany(
      { _id: { $in: ids }, institutionId, deletedAt: null },
      {
        $set: {
          status,
          isActive,
          ...(status === 'archived'
            ? { deletedAt: new Date(), isActive: false }
            : {}),
        },
      },
    ).exec();
    return res.modifiedCount;
  }

  async bulkArchive(institutionId: string, ids: string[]): Promise<number> {
    const res = await FacultyModel.updateMany(
      { _id: { $in: ids }, institutionId, deletedAt: null },
      { $set: { deletedAt: new Date(), status: 'archived', isActive: false } },
    ).exec();
    return res.modifiedCount;
  }

  async bulkAssignDepartment(
    institutionId: string,
    ids: string[],
    departmentId: string,
    schoolId?: string | null,
    campusId?: string | null,
  ): Promise<number> {
    const $set: Record<string, unknown> = { departmentId };
    if (schoolId !== undefined) $set.schoolId = schoolId;
    if (campusId !== undefined) $set.campusId = campusId;
    const res = await FacultyModel.updateMany(
      { _id: { $in: ids }, institutionId, deletedAt: null },
      { $set },
    ).exec();
    return res.modifiedCount;
  }

  async bulkAssignPrograms(
    institutionId: string,
    ids: string[],
    programIds: string[],
    mode: 'replace' | 'append',
  ): Promise<number> {
    if (mode === 'replace') {
      const res = await FacultyModel.updateMany(
        { _id: { $in: ids }, institutionId, deletedAt: null },
        { $set: { programIds } },
      ).exec();
      return res.modifiedCount;
    }
    const res = await FacultyModel.updateMany(
      { _id: { $in: ids }, institutionId, deletedAt: null },
      { $addToSet: { programIds: { $each: programIds } } },
    ).exec();
    return res.modifiedCount;
  }

  async stats(institutionId: string) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [totals, byDepartment, byEmploymentType, byExperience, newThisMonth] =
      await Promise.all([
        FacultyModel.aggregate([
          { $match: { institutionId: FacultyModel.schema.path('institutionId') ? undefined : undefined } },
        ]).catch(() => []),
        FacultyModel.aggregate([
          { $match: { institutionId, deletedAt: null } },
          { $group: { _id: '$departmentId', count: { $sum: 1 } } },
        ]),
        FacultyModel.aggregate([
          { $match: { institutionId, deletedAt: null } },
          { $group: { _id: '$employmentType', count: { $sum: 1 } } },
        ]),
        FacultyModel.aggregate([
          { $match: { institutionId, deletedAt: null } },
          {
            $bucket: {
              groupBy: '$experienceYears',
              boundaries: [0, 3, 6, 11, 16, 100],
              default: '16+',
              output: { count: { $sum: 1 } },
            },
          },
        ]),
        FacultyModel.countDocuments({
          institutionId,
          deletedAt: null,
          createdAt: { $gte: startOfMonth },
        }),
      ]);

    void totals;

    const [total, active, onLeave, suspended, retired, archived, inactive] = await Promise.all([
      FacultyModel.countDocuments({ institutionId, deletedAt: null }),
      FacultyModel.countDocuments({ institutionId, deletedAt: null, status: 'active' }),
      FacultyModel.countDocuments({ institutionId, deletedAt: null, status: 'on_leave' }),
      FacultyModel.countDocuments({ institutionId, deletedAt: null, status: 'suspended' }),
      FacultyModel.countDocuments({ institutionId, deletedAt: null, status: 'retired' }),
      FacultyModel.countDocuments({ institutionId, status: 'archived' }),
      FacultyModel.countDocuments({
        institutionId,
        deletedAt: null,
        status: { $in: ['suspended', 'retired'] },
      }),
    ]);

    const departmentIds = byDepartment
      .map((d) => d._id)
      .filter(Boolean)
      .map(String);

    return {
      total,
      active,
      inactive,
      onLeave,
      suspended,
      retired,
      archived,
      departments: new Set(departmentIds).size,
      newThisMonth,
      byDepartment,
      byEmploymentType,
      byExperience,
    };
  }

  async listAudit(institutionId: string, facultyId?: string, limit = 50) {
    const filter: FilterQuery<unknown> = { institutionId };
    if (facultyId) filter.facultyId = facultyId;
    return FacultyAuditLogModel.find(filter).sort({ createdAt: -1 }).limit(limit).exec();
  }

  async logAudit(input: {
    event: FacultyAuditEvent;
    institutionId: string;
    facultyId?: string | null;
    userId?: string | null;
    email?: string | null;
    metadata?: Record<string, unknown>;
  }) {
    return FacultyAuditLogModel.create({
      event: input.event,
      institutionId: input.institutionId,
      facultyId: input.facultyId ?? null,
      userId: input.userId ?? null,
      email: input.email ?? null,
      metadata: input.metadata ?? {},
    });
  }
}

export const facultyRepository = new FacultyRepository();
