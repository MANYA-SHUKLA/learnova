import { Types } from 'mongoose';
import type { StudentListQuery } from '@learnova/validation';
import { StudentModel, type StudentDocument } from '../../models/student.model.js';
import {
  StudentAuditLogModel,
  type StudentAuditEvent,
} from '../../models/student-audit-log.model.js';

export interface StudentListResult {
  items: StudentDocument[];
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

export class StudentRepository {
  buildFilter(institutionId: string, query: StudentListQuery): Record<string, unknown> {
    const filter: Record<string, unknown> = { institutionId: toObjectId(institutionId) };

    if (!query.includeDeleted) {
      filter.deletedAt = null;
    }
    if (query.status) filter.status = query.status;
    if (query.campusId) filter.campusId = toObjectId(query.campusId);
    if (query.schoolId) filter.schoolId = toObjectId(query.schoolId);
    if (query.departmentId) filter.departmentId = toObjectId(query.departmentId);
    if (query.programId) filter.programId = toObjectId(query.programId);
    if (query.academicYearId) filter.academicYearId = toObjectId(query.academicYearId);
    if (query.semesterId) filter.semesterId = toObjectId(query.semesterId);
    if (query.sectionId) filter.sectionId = toObjectId(query.sectionId);
    if (query.batchId) filter.batchId = toObjectId(query.batchId);
    if (query.yearOfStudy !== undefined) filter.yearOfStudy = query.yearOfStudy;
    if (query.scholarship !== undefined) filter.scholarship = query.scholarship;

    if (query.q) {
      const regex = new RegExp(escapeRegex(query.q), 'i');
      filter.$or = [
        { fullName: regex },
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        { studentId: regex },
        { admissionNumber: regex },
        { rollNumber: regex },
      ];
    }

    return filter;
  }

  async list(institutionId: string, query: StudentListQuery): Promise<StudentListResult> {
    const filter = this.buildFilter(institutionId, query);
    const page = query.page;
    const limit = query.limit;
    const sortField = query.sortBy ?? 'createdAt';
    const sortDir = query.sortOrder === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      StudentModel.find(filter)
        .sort({ [sortField]: sortDir })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      StudentModel.countDocuments(filter).exec(),
    ]);

    return { items, total, page, limit };
  }

  async findById(institutionId: string, id: string): Promise<StudentDocument | null> {
    return StudentModel.findOne({
      _id: id,
      institutionId: toObjectId(institutionId),
      deletedAt: null,
    }).exec();
  }

  async findByIdIncludingDeleted(
    institutionId: string,
    id: string,
  ): Promise<StudentDocument | null> {
    return StudentModel.findOne({
      _id: id,
      institutionId: toObjectId(institutionId),
    }).exec();
  }

  async findByEmail(institutionId: string, email: string): Promise<StudentDocument | null> {
    return StudentModel.findOne({
      institutionId: toObjectId(institutionId),
      email: email.toLowerCase(),
      deletedAt: null,
    }).exec();
  }

  async findDuplicates(
    institutionId: string,
    keys: { studentId?: string; admissionNumber?: string; email?: string },
  ): Promise<StudentDocument[]> {
    const or: Record<string, unknown>[] = [];
    if (keys.studentId) or.push({ studentId: keys.studentId });
    if (keys.admissionNumber) or.push({ admissionNumber: keys.admissionNumber });
    if (keys.email) or.push({ email: keys.email.toLowerCase() });
    if (or.length === 0) return [];
    return StudentModel.find({
      institutionId: toObjectId(institutionId),
      deletedAt: null,
      $or: or,
    }).exec();
  }

  async create(data: Record<string, unknown>): Promise<StudentDocument> {
    return StudentModel.create(data);
  }

  async updateById(
    institutionId: string,
    id: string,
    data: Record<string, unknown>,
  ): Promise<StudentDocument | null> {
    return StudentModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId), deletedAt: null },
      { $set: data },
      { new: true },
    ).exec();
  }

  async softDelete(institutionId: string, id: string): Promise<StudentDocument | null> {
    return StudentModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId), deletedAt: null },
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

  async restore(institutionId: string, id: string): Promise<StudentDocument | null> {
    return StudentModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId), deletedAt: { $ne: null } },
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
    const res = await StudentModel.deleteOne({
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
    const isActive = status === 'active';
    const res = await StudentModel.updateMany(
      {
        _id: { $in: ids },
        institutionId: toObjectId(institutionId),
        deletedAt: null,
      },
      {
        $set: {
          status,
          isActive,
          ...(status === 'archived' ? { deletedAt: new Date(), isActive: false } : {}),
        },
      },
    ).exec();
    return res.modifiedCount;
  }

  async bulkArchive(institutionId: string, ids: string[]): Promise<number> {
    const res = await StudentModel.updateMany(
      {
        _id: { $in: ids },
        institutionId: toObjectId(institutionId),
        deletedAt: null,
      },
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
    programId?: string | null,
  ): Promise<number> {
    const $set: Record<string, unknown> = { departmentId: toObjectId(departmentId) };
    if (schoolId !== undefined) {
      $set.schoolId = schoolId ? toObjectId(schoolId) : null;
    }
    if (campusId !== undefined) {
      $set.campusId = campusId ? toObjectId(campusId) : null;
    }
    if (programId !== undefined) {
      $set.programId = programId ? toObjectId(programId) : null;
    }
    const res = await StudentModel.updateMany(
      {
        _id: { $in: ids },
        institutionId: toObjectId(institutionId),
        deletedAt: null,
      },
      { $set },
    ).exec();
    return res.modifiedCount;
  }

  async bulkAssignSection(
    institutionId: string,
    ids: string[],
    sectionId: string,
  ): Promise<number> {
    const res = await StudentModel.updateMany(
      {
        _id: { $in: ids },
        institutionId: toObjectId(institutionId),
        deletedAt: null,
      },
      { $set: { sectionId: toObjectId(sectionId) } },
    ).exec();
    return res.modifiedCount;
  }

  async bulkAssignSemester(
    institutionId: string,
    ids: string[],
    input: {
      semesterId: string;
      academicYearId?: string | null;
      currentSemester?: number | null;
    },
  ): Promise<number> {
    const $set: Record<string, unknown> = { semesterId: toObjectId(input.semesterId) };
    if (input.academicYearId !== undefined) {
      $set.academicYearId = input.academicYearId
        ? toObjectId(input.academicYearId)
        : null;
    }
    if (input.currentSemester !== undefined) {
      $set.currentSemester = input.currentSemester;
    }
    const res = await StudentModel.updateMany(
      {
        _id: { $in: ids },
        institutionId: toObjectId(institutionId),
        deletedAt: null,
      },
      { $set },
    ).exec();
    return res.modifiedCount;
  }

  async bulkAssignBatch(
    institutionId: string,
    ids: string[],
    batchId: string,
  ): Promise<number> {
    const res = await StudentModel.updateMany(
      {
        _id: { $in: ids },
        institutionId: toObjectId(institutionId),
        deletedAt: null,
      },
      { $set: { batchId: toObjectId(batchId) } },
    ).exec();
    return res.modifiedCount;
  }

  async stats(institutionId: string) {
    const oid = toObjectId(institutionId);
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      total,
      active,
      inactive,
      suspended,
      graduated,
      dropped,
      transferred,
      archived,
      scholarshipCount,
      newThisMonth,
      byDepartment,
      byProgram,
      byBatch,
      bySection,
      byStatus,
      recentAdmissions,
    ] = await Promise.all([
      StudentModel.countDocuments({ institutionId: oid, deletedAt: null }),
      StudentModel.countDocuments({ institutionId: oid, deletedAt: null, status: 'active' }),
      StudentModel.countDocuments({
        institutionId: oid,
        deletedAt: null,
        status: 'inactive',
      }),
      StudentModel.countDocuments({
        institutionId: oid,
        deletedAt: null,
        status: 'suspended',
      }),
      StudentModel.countDocuments({
        institutionId: oid,
        deletedAt: null,
        status: 'graduated',
      }),
      StudentModel.countDocuments({ institutionId: oid, deletedAt: null, status: 'dropped' }),
      StudentModel.countDocuments({
        institutionId: oid,
        deletedAt: null,
        status: 'transferred',
      }),
      StudentModel.countDocuments({ institutionId: oid, status: 'archived' }),
      StudentModel.countDocuments({
        institutionId: oid,
        deletedAt: null,
        scholarship: true,
      }),
      StudentModel.countDocuments({
        institutionId: oid,
        deletedAt: null,
        createdAt: { $gte: startOfMonth },
      }),
      StudentModel.aggregate([
        { $match: { institutionId: oid, deletedAt: null } },
        { $group: { _id: '$departmentId', count: { $sum: 1 } } },
      ]),
      StudentModel.aggregate([
        { $match: { institutionId: oid, deletedAt: null } },
        { $group: { _id: '$programId', count: { $sum: 1 } } },
      ]),
      StudentModel.aggregate([
        { $match: { institutionId: oid, deletedAt: null } },
        { $group: { _id: '$batchId', count: { $sum: 1 } } },
      ]),
      StudentModel.aggregate([
        { $match: { institutionId: oid, deletedAt: null } },
        { $group: { _id: '$sectionId', count: { $sum: 1 } } },
      ]),
      StudentModel.aggregate([
        { $match: { institutionId: oid, deletedAt: null } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      StudentModel.find({ institutionId: oid, deletedAt: null })
        .sort({ admissionDate: -1, createdAt: -1 })
        .limit(6)
        .select('fullName studentId admissionNumber admissionDate programId')
        .exec(),
    ]);

    return {
      total,
      active,
      inactive,
      suspended,
      graduated,
      dropped,
      transferred,
      archived,
      scholarshipCount,
      newThisMonth,
      byDepartment,
      byProgram,
      byBatch,
      bySection,
      byStatus,
      recentAdmissions,
    };
  }

  async listAudit(institutionId: string, studentId?: string, limit = 50) {
    const filter: Record<string, unknown> = { institutionId: toObjectId(institutionId) };
    if (studentId) filter.studentId = toObjectId(studentId);
    return StudentAuditLogModel.find(filter).sort({ createdAt: -1 }).limit(limit).exec();
  }

  async logAudit(input: {
    event: StudentAuditEvent;
    institutionId: string;
    studentId?: string | null;
    userId?: string | null;
    email?: string | null;
    metadata?: Record<string, unknown>;
  }) {
    return StudentAuditLogModel.create({
      event: input.event,
      institutionId: toObjectId(input.institutionId),
      studentId: input.studentId ? toObjectId(input.studentId) : null,
      userId: input.userId ? toObjectId(input.userId) : null,
      email: input.email ?? null,
      metadata: input.metadata ?? {},
    });
  }
}

export const studentRepository = new StudentRepository();
