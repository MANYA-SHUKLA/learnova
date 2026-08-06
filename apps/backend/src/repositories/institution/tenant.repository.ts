import type { Model, Types } from 'mongoose';
import type { FilterQuery, SortOrder } from 'mongoose';
import type { OrgListQuery } from '@learnova/validation';

export interface ListResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

interface DocWithId { _id: Types.ObjectId }

export class TenantSoftDeleteRepository<T extends DocWithId> {
  constructor(
    protected readonly model: Model<T>,
    private readonly searchFields: string[] = ['name', 'code'],
  ) {}

  protected baseFilter(
    institutionId: string,
    query: OrgListQuery,
    extra: FilterQuery<T> = {},
  ): FilterQuery<T> {
    const filter: FilterQuery<T> = {
      ...extra,
      institutionId,
    };

    if (!query.includeDeleted) {
      (filter as Record<string, unknown>).deletedAt = null;
    }
    if (query.status) {
      (filter as Record<string, unknown>).status = query.status;
    }
    if (query.q) {
      const regex = new RegExp(query.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      (filter as Record<string, unknown>).$or = this.searchFields.map((field) => ({
        [field]: regex,
      }));
    }
    if (query.schoolId) (filter as Record<string, unknown>).schoolId = query.schoolId;
    if (query.departmentId) {
      (filter as Record<string, unknown>).departmentId = query.departmentId;
    }
    if (query.programId) (filter as Record<string, unknown>).programId = query.programId;
    if (query.academicYearId) {
      (filter as Record<string, unknown>).academicYearId = query.academicYearId;
    }
    if (query.semesterId) (filter as Record<string, unknown>).semesterId = query.semesterId;

    return filter;
  }

  async list(
    institutionId: string,
    query: OrgListQuery,
    extra: FilterQuery<T> = {},
  ): Promise<ListResult<T>> {
    const filter = this.baseFilter(institutionId, query, extra);
    const page = query.page;
    const limit = query.limit;
    const sortField = query.sortBy ?? 'createdAt';
    const sortDir: SortOrder = query.sortOrder === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ [sortField]: sortDir })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.model.countDocuments(filter).exec(),
    ]);

    return { items, total, page, limit };
  }

  async findById(institutionId: string, id: string): Promise<T | null> {
    return this.model
      .findOne({ _id: id, institutionId, deletedAt: null })
      .exec();
  }

  async findByIdIncludingDeleted(institutionId: string, id: string): Promise<T | null> {
    return this.model.findOne({ _id: id, institutionId }).exec();
  }

  async create(data: Partial<T>): Promise<T> {
    return this.model.create(data);
  }

  async updateById(
    institutionId: string,
    id: string,
    data: Partial<T>,
  ): Promise<T | null> {
    return this.model
      .findOneAndUpdate(
        { _id: id, institutionId, deletedAt: null },
        { $set: data },
        { new: true },
      )
      .exec();
  }

  async softDelete(institutionId: string, id: string): Promise<T | null> {
    return this.model
      .findOneAndUpdate(
        { _id: id, institutionId, deletedAt: null },
        { $set: { deletedAt: new Date(), status: 'archived' } },
        { new: true },
      )
      .exec();
  }

  async restore(institutionId: string, id: string): Promise<T | null> {
    return this.model
      .findOneAndUpdate(
        { _id: id, institutionId, deletedAt: { $ne: null } },
        { $set: { deletedAt: null, status: 'active' } },
        { new: true },
      )
      .exec();
  }

  async hardDelete(institutionId: string, id: string): Promise<boolean> {
    const res = await this.model
      .deleteOne({ _id: id, institutionId })
      .exec();
    return res.deletedCount > 0;
  }
}
