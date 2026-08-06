import {
  AcademicCalendarModel,
  AcademicYearModel,
  BatchModel,
  CampusModel,
  DepartmentModel,
  InstitutionAuditLogModel,
  InstitutionModel,
  InstitutionSettingsModel,
  ProgramModel,
  SchoolModel,
  SectionModel,
  SemesterModel,
} from '../../models/index.js';
import { TenantSoftDeleteRepository } from './tenant.repository.js';
import { Types } from 'mongoose';
import type { OrgListQuery } from '@learnova/validation';

// re-export Models for services that need direct queries
export { AcademicYearModel };

export const campusRepository = new TenantSoftDeleteRepository(
  CampusModel as never,
  ['name', 'code', 'city'],
);
export const schoolRepository = new TenantSoftDeleteRepository(
  SchoolModel as never,
  ['name', 'code'],
);
export const departmentRepository = new TenantSoftDeleteRepository(
  DepartmentModel as never,
  ['name', 'code'],
);
export const programRepository = new TenantSoftDeleteRepository(
  ProgramModel as never,
  ['name', 'code'],
);
export const academicYearRepository = new TenantSoftDeleteRepository(
  AcademicYearModel as never,
  ['name'],
);
export const semesterRepository = new TenantSoftDeleteRepository(
  SemesterModel as never,
  ['name'],
);
export const sectionRepository = new TenantSoftDeleteRepository(
  SectionModel as never,
  ['name'],
);
export const batchRepository = new TenantSoftDeleteRepository(
  BatchModel as never,
  ['name'],
);
export const academicCalendarRepository = new TenantSoftDeleteRepository(
  AcademicCalendarModel as never,
  ['name'],
);

export class InstitutionRepository {
  async create(data: Record<string, unknown>) {
    return InstitutionModel.create(data);
  }

  async findById(id: string) {
    return InstitutionModel.findOne({ _id: id, deletedAt: null }).exec();
  }

  async findByIdIncludingDeleted(id: string) {
    return InstitutionModel.findById(id).exec();
  }

  async updateById(id: string, data: Record<string, unknown>) {
    return InstitutionModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: data },
      { new: true },
    ).exec();
  }

  async softDelete(id: string) {
    return InstitutionModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { deletedAt: new Date(), status: 'archived' } },
      { new: true },
    ).exec();
  }

  async restore(id: string) {
    return InstitutionModel.findOneAndUpdate(
      { _id: id, deletedAt: { $ne: null } },
      { $set: { deletedAt: null, status: 'active' } },
      { new: true },
    ).exec();
  }

  async list(query: OrgListQuery) {
    const filter: Record<string, unknown> = {};
    if (!query.includeDeleted) filter.deletedAt = null;
    if (query.status) filter.status = query.status;
    if (query.q) {
      const regex = new RegExp(query.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: regex }, { code: regex }, { slug: regex }, { email: regex }];
    }
    const page = query.page;
    const limit = query.limit;
    const sortField = query.sortBy ?? 'createdAt';
    const sortDir = query.sortOrder === 'asc' ? 1 : -1;
    const [items, total] = await Promise.all([
      InstitutionModel.find(filter)
        .sort({ [sortField]: sortDir })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      InstitutionModel.countDocuments(filter).exec(),
    ]);
    return { items, total, page, limit };
  }
}

export class InstitutionSettingsRepository {
  async getOrCreate(institutionId: string) {
    let doc = await InstitutionSettingsModel.findOne({ institutionId }).exec();
    doc ??= await InstitutionSettingsModel.create({
      institutionId: new Types.ObjectId(institutionId),
    });
    return doc;
  }

  async update(institutionId: string, data: Record<string, unknown>) {
    const doc = await InstitutionSettingsModel.findOneAndUpdate(
      { institutionId },
      { $set: data },
      { new: true, upsert: true },
    )
      .orFail()
      .exec();
    return doc;
  }
}

export class InstitutionAuditRepository {
  async log(input: {
    event: string;
    institutionId?: string | null;
    userId?: string | null;
    email?: string | null;
    metadata?: Record<string, unknown>;
  }) {
    return InstitutionAuditLogModel.create({
      event: input.event,
      institutionId: input.institutionId
        ? new Types.ObjectId(input.institutionId)
        : null,
      userId: input.userId ? new Types.ObjectId(input.userId) : null,
      email: input.email ?? null,
      metadata: input.metadata ?? {},
    });
  }
}

export const institutionRepository = new InstitutionRepository();
export const institutionSettingsRepository = new InstitutionSettingsRepository();
export const institutionAuditRepository = new InstitutionAuditRepository();
