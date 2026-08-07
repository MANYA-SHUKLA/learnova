import { Types } from 'mongoose';
import { EVENTS } from '@learnova/events';
import type {
  CreateFacultyInput,
  FacultyBulkAssignAcademicInput,
  FacultyBulkAssignDepartmentInput,
  FacultyBulkAssignProgramInput,
  FacultyBulkIdsInput,
  FacultyBulkStatusInput,
  FacultyExportQuery,
  FacultyImportConfirmInput,
  FacultyListQuery,
  FacultyPhotoUploadInput,
  UpdateFacultyInput,
  UpdateFacultyProfileInput,
} from '@learnova/validation';
import { createFacultySchema } from '@learnova/validation';
import { eventBus } from '../../events/index.js';
import { DepartmentModel } from '../../models/department.model.js';
import { getStorage } from '../../storage/index.js';
import { logger } from '../../utils/logger/index.js';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../utils/errors/index.js';
import { facultyRepository } from '../../repositories/faculty/index.js';

export interface ActorContext {
  userId: string;
  email: string;
  institutionId: string | null;
  role: string;
}

function requireTenant(actor: ActorContext): string {
  if (!actor.institutionId) {
    throw new ForbiddenError('Institution context required');
  }
  return actor.institutionId;
}

function buildFullName(firstName: string, middleName: string | null | undefined, lastName: string) {
  return [firstName, middleName, lastName].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

function toDto(doc: {
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

  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rest)) {
    if (value instanceof Types.ObjectId) {
      normalized[key] = String(value);
    } else if (value instanceof Date) {
      normalized[key] = value.toISOString();
    } else if (Array.isArray(value)) {
      normalized[key] = value.map((item) =>
        item instanceof Types.ObjectId ? String(item) : item,
      );
    } else {
      normalized[key] = value;
    }
  }

  return {
    id: String(_id),
    ...normalized,
    deletedAt:
      rest.deletedAt instanceof Date
        ? rest.deletedAt.toISOString()
        : (rest.deletedAt ?? null),
  };
}

function pageMeta(total: number, page: number, limit: number) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

function experienceBucketLabel(id: number | string): string {
  if (id === '16+' || id === 16) return '16+ years';
  if (id === 0) return '0–2 years';
  if (id === 3) return '3–5 years';
  if (id === 6) return '6–10 years';
  if (id === 11) return '11–15 years';
  return String(id);
}

const CSV_HEADERS = [
  'employeeId',
  'facultyCode',
  'firstName',
  'middleName',
  'lastName',
  'email',
  'phone',
  'designation',
  'customDesignation',
  'employmentType',
  'departmentId',
  'schoolId',
  'campusId',
  'joiningDate',
  'experienceYears',
  'status',
  'specialization',
  'researchAreas',
] as const;

function escapeCsv(value: unknown): string {
  const str = value == null ? '' : String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function rowsToCsv(rows: Array<Record<string, unknown>>): string {
  const lines = [CSV_HEADERS.join(',')];
  for (const row of rows) {
    lines.push(CSV_HEADERS.map((h) => escapeCsv(row[h])).join(','));
  }
  return `${lines.join('\n')}\n`;
}

export class FacultyService {
  private async audit(
    event: Parameters<typeof facultyRepository.logAudit>[0]['event'],
    actor: ActorContext,
    institutionId: string,
    facultyId?: string | null,
    metadata?: Record<string, unknown>,
  ) {
    await facultyRepository.logAudit({
      event,
      institutionId,
      facultyId,
      userId: actor.userId,
      email: actor.email,
      metadata,
    });
  }

  async create(input: CreateFacultyInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const duplicates = await facultyRepository.findDuplicates(institutionId, {
      employeeId: input.employeeId,
      facultyCode: input.facultyCode,
      email: input.email,
    });
    if (duplicates.length > 0) {
      throw new ConflictError('Faculty with same employee ID, code, or email already exists');
    }

    const fullName = buildFullName(input.firstName, input.middleName, input.lastName);
    const doc = await facultyRepository.create({
      ...input,
      facultyCode: input.facultyCode.toUpperCase(),
      email: input.email.toLowerCase(),
      fullName,
      programIds: (input.programIds ?? []).map((id) => new Types.ObjectId(id)),
      courseIds: (input.courseIds ?? []).map((id) => new Types.ObjectId(id)),
      campusId: input.campusId ? new Types.ObjectId(input.campusId) : null,
      schoolId: input.schoolId ? new Types.ObjectId(input.schoolId) : null,
      departmentId: input.departmentId ? new Types.ObjectId(input.departmentId) : null,
      academicYearId: input.academicYearId ? new Types.ObjectId(input.academicYearId) : null,
      semesterId: input.semesterId ? new Types.ObjectId(input.semesterId) : null,
      institutionId: new Types.ObjectId(institutionId),
      createdBy: new Types.ObjectId(actor.userId),
      updatedBy: new Types.ObjectId(actor.userId),
      deletedAt: null,
      isActive: input.status === 'active' || input.status === 'on_leave',
    });

    await this.audit('faculty.created', actor, institutionId, String(doc._id));
    await eventBus.publish(EVENTS.FACULTY_CREATED, {
      facultyId: String(doc._id),
      institutionId,
    }, { actorId: actor.userId });

    try {
      const { provisionLoginUser } = await import('../users/provision-login-user.js');
      await provisionLoginUser({
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        institutionId,
        role: 'faculty',
      });
    } catch (err) {
      logger.warn({ err, email: input.email }, 'Faculty login user provisioning skipped/failed');
    }

    return toDto(doc);
  }

  async list(query: FacultyListQuery, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const result = await facultyRepository.list(institutionId, query);
    return {
      items: result.items.map((d) => toDto(d)),
      meta: pageMeta(result.total, result.page, result.limit),
    };
  }

  async search(q: string, page: number, limit: number, actor: ActorContext) {
    return this.list({ q, page, limit, includeDeleted: false }, actor);
  }

  async get(id: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const doc = await facultyRepository.findByIdIncludingDeleted(institutionId, id);
    if (!doc) throw new NotFoundError('Faculty not found');
    return toDto(doc);
  }

  async update(id: string, input: UpdateFacultyInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const existing = await facultyRepository.findById(institutionId, id);
    if (!existing) throw new NotFoundError('Faculty not found');

    if (input.employeeId || input.facultyCode || input.email) {
      const duplicates = await facultyRepository.findDuplicates(institutionId, {
        employeeId: input.employeeId,
        facultyCode: input.facultyCode,
        email: input.email,
      });
      const conflict = duplicates.find((d) => String(d._id) !== id);
      if (conflict) {
        throw new ConflictError('Faculty with same employee ID, code, or email already exists');
      }
    }

    const patch: Record<string, unknown> = { ...input, updatedBy: new Types.ObjectId(actor.userId) };
    if (input.facultyCode) patch.facultyCode = input.facultyCode.toUpperCase();
    if (input.email) patch.email = input.email.toLowerCase();
    if (input.programIds) {
      patch.programIds = input.programIds.map((pid) => new Types.ObjectId(pid));
    }
    if (input.courseIds) {
      patch.courseIds = input.courseIds.map((cid) => new Types.ObjectId(cid));
    }
    if (input.campusId !== undefined) {
      patch.campusId = input.campusId ? new Types.ObjectId(input.campusId) : null;
    }
    if (input.schoolId !== undefined) {
      patch.schoolId = input.schoolId ? new Types.ObjectId(input.schoolId) : null;
    }
    if (input.departmentId !== undefined) {
      patch.departmentId = input.departmentId ? new Types.ObjectId(input.departmentId) : null;
    }
    if (input.academicYearId !== undefined) {
      patch.academicYearId = input.academicYearId
        ? new Types.ObjectId(input.academicYearId)
        : null;
    }
    if (input.semesterId !== undefined) {
      patch.semesterId = input.semesterId ? new Types.ObjectId(input.semesterId) : null;
    }

    const firstName = input.firstName ?? existing.firstName;
    const middleName =
      input.middleName !== undefined ? input.middleName : existing.middleName;
    const lastName = input.lastName ?? existing.lastName;
    if (input.firstName || input.middleName !== undefined || input.lastName) {
      patch.fullName = buildFullName(firstName, middleName, lastName);
    }

    if (input.status) {
      patch.isActive = input.status === 'active' || input.status === 'on_leave';
    }

    const doc = await facultyRepository.updateById(institutionId, id, patch);
    if (!doc) throw new NotFoundError('Faculty not found');

    const statusChanged = input.status && input.status !== existing.status;
    await this.audit(
      statusChanged ? 'faculty.status.changed' : 'faculty.updated',
      actor,
      institutionId,
      id,
      statusChanged ? { status: input.status } : { fields: Object.keys(input) },
    );

    await eventBus.publish(EVENTS.FACULTY_UPDATED, { facultyId: id, institutionId }, {
      actorId: actor.userId,
    });
    if (statusChanged && input.status) {
      await eventBus.publish(
        EVENTS.FACULTY_STATUS_CHANGED,
        { facultyId: id, institutionId, status: input.status },
        { actorId: actor.userId },
      );
    }

    return toDto(doc);
  }

  async getOwnProfile(actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const existing = await facultyRepository.findByEmail(institutionId, actor.email);
    if (!existing) throw new NotFoundError('Faculty profile not found for this account');
    return toDto(existing);
  }

  async updateOwnProfile(input: UpdateFacultyProfileInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const existing = await facultyRepository.findByEmail(institutionId, actor.email);
    if (!existing) throw new NotFoundError('Faculty profile not found for this account');

    const doc = await facultyRepository.updateById(institutionId, String(existing._id), {
      ...input,
      updatedBy: new Types.ObjectId(actor.userId),
    });
    if (!doc) throw new NotFoundError('Faculty not found');

    await this.audit('faculty.profile.updated', actor, institutionId, String(doc._id), {
      fields: Object.keys(input),
    });
    await eventBus.publish(
      EVENTS.FACULTY_UPDATED,
      { facultyId: String(doc._id), institutionId },
      { actorId: actor.userId },
    );
    return toDto(doc);
  }

  async archive(id: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const doc = await facultyRepository.softDelete(institutionId, id);
    if (!doc) throw new NotFoundError('Faculty not found');
    await this.audit('faculty.archived', actor, institutionId, id);
    await eventBus.publish(EVENTS.FACULTY_DELETED, { facultyId: id, institutionId }, {
      actorId: actor.userId,
    });
    return toDto(doc);
  }

  async restore(id: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const doc = await facultyRepository.restore(institutionId, id);
    if (!doc) throw new NotFoundError('Faculty not found');
    await this.audit('faculty.restored', actor, institutionId, id);
    await eventBus.publish(
      EVENTS.FACULTY_STATUS_CHANGED,
      { facultyId: id, institutionId, status: 'active' },
      { actorId: actor.userId },
    );
    return toDto(doc);
  }

  async activate(id: string, actor: ActorContext) {
    return this.update(id, { status: 'active', isActive: true }, actor);
  }

  async deactivate(id: string, actor: ActorContext) {
    return this.update(id, { status: 'suspended', isActive: false }, actor);
  }

  async getStats(actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const raw = await facultyRepository.stats(institutionId);

    const departmentIds = raw.byDepartment
      .map((d) => d._id)
      .filter(Boolean)
      .map(String);

    const departments =
      departmentIds.length > 0
        ? await DepartmentModel.find({ _id: { $in: departmentIds } }).exec()
        : [];
    const deptName = new Map(departments.map((d) => [String(d._id), d.name]));

    return {
      total: raw.total,
      active: raw.active,
      inactive: raw.inactive,
      onLeave: raw.onLeave,
      suspended: raw.suspended,
      retired: raw.retired,
      archived: raw.archived,
      departments: raw.departments,
      newThisMonth: raw.newThisMonth,
      byDepartment: raw.byDepartment.map((d) => ({
        departmentId: d._id ? String(d._id) : null,
        label: d._id ? (deptName.get(String(d._id)) ?? 'Unknown') : 'Unassigned',
        count: d.count as number,
      })),
      byEmploymentType: raw.byEmploymentType.map((d) => ({
        employmentType: d._id as string,
        count: d.count as number,
      })),
      byExperience: raw.byExperience.map((d) => ({
        bucket: experienceBucketLabel(d._id as number | string),
        count: d.count as number,
      })),
      recentJoinees: raw.recentJoinees.map((doc) => ({
        id: String(doc._id),
        fullName: doc.fullName,
        employeeId: doc.employeeId,
        joiningDate:
          doc.joiningDate instanceof Date
            ? doc.joiningDate.toISOString()
            : doc.joiningDate
              ? String(doc.joiningDate)
              : null,
        designation: doc.customDesignation || doc.designation,
      })),
    };
  }

  async listAudit(facultyId: string | undefined, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const items = await facultyRepository.listAudit(institutionId, facultyId, 100);
    return items.map((item) => ({
      id: String(item._id),
      event: item.event,
      facultyId: item.facultyId ? String(item.facultyId) : null,
      userId: item.userId ? String(item.userId) : null,
      email: item.email,
      metadata: item.metadata,
      createdAt:
        item.createdAt instanceof Date
          ? item.createdAt.toISOString()
          : String(item.createdAt),
    }));
  }

  async bulkArchive(input: FacultyBulkIdsInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const modified = await facultyRepository.bulkArchive(institutionId, input.ids);
    await this.audit('faculty.archived', actor, institutionId, null, {
      bulk: true,
      ids: input.ids,
      modified,
    });
    return { modified };
  }

  async bulkActivate(input: FacultyBulkIdsInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const modified = await facultyRepository.bulkUpdateStatus(
      institutionId,
      input.ids,
      'active',
    );
    await this.audit('faculty.status.changed', actor, institutionId, null, {
      bulk: true,
      status: 'active',
      ids: input.ids,
      modified,
    });
    return { modified };
  }

  async bulkSuspend(input: FacultyBulkIdsInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const modified = await facultyRepository.bulkUpdateStatus(
      institutionId,
      input.ids,
      'suspended',
    );
    await this.audit('faculty.status.changed', actor, institutionId, null, {
      bulk: true,
      status: 'suspended',
      ids: input.ids,
      modified,
    });
    return { modified };
  }

  async bulkStatus(input: FacultyBulkStatusInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const modified = await facultyRepository.bulkUpdateStatus(
      institutionId,
      input.ids,
      input.status,
    );
    await this.audit('faculty.status.changed', actor, institutionId, null, {
      bulk: true,
      status: input.status,
      ids: input.ids,
      modified,
    });
    return { modified };
  }

  async bulkAssignDepartment(input: FacultyBulkAssignDepartmentInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const modified = await facultyRepository.bulkAssignDepartment(
      institutionId,
      input.ids,
      input.departmentId,
      input.schoolId,
      input.campusId,
    );
    await this.audit('faculty.updated', actor, institutionId, null, {
      bulk: true,
      action: 'assign_department',
      departmentId: input.departmentId,
      modified,
    });
    return { modified };
  }

  async bulkAssignProgram(input: FacultyBulkAssignProgramInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const modified = await facultyRepository.bulkAssignPrograms(
      institutionId,
      input.ids,
      input.programIds,
      input.mode ?? 'append',
    );
    await this.audit('faculty.updated', actor, institutionId, null, {
      bulk: true,
      action: 'assign_program',
      programIds: input.programIds,
      modified,
    });
    return { modified };
  }

  async bulkAssignAcademic(input: FacultyBulkAssignAcademicInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const modified = await facultyRepository.bulkAssignAcademic(institutionId, input.ids, {
      academicYearId: input.academicYearId,
      semesterId: input.semesterId,
      courseIds: input.courseIds,
      mode: input.mode,
    });
    await this.audit('faculty.updated', actor, institutionId, null, {
      bulk: true,
      action: 'assign_academic',
      academicYearId: input.academicYearId,
      semesterId: input.semesterId,
      courseIds: input.courseIds,
      modified,
    });
    return { modified };
  }

  previewImport(rows: Array<Record<string, string>>) {
    const errors: Array<{ row: number; field?: string; message: string }> = [];
    let validRows = 0;
    let duplicates = 0;
    const seen = new Set<string>();
    const sample: Array<Record<string, string>> = [];

    rows.forEach((row, index) => {
      const parsed = createFacultySchema.safeParse({
        employeeId: row.employeeId,
        facultyCode: row.facultyCode,
        firstName: row.firstName,
        middleName: row.middleName || null,
        lastName: row.lastName,
        email: row.email,
        designation: row.designation || 'assistant_professor',
        customDesignation: row.customDesignation || null,
        employmentType: row.employmentType || 'full_time',
        phone: row.phone || null,
        departmentId: row.departmentId || null,
        schoolId: row.schoolId || null,
        campusId: row.campusId || null,
        experienceYears: row.experienceYears ? Number(row.experienceYears) : 0,
        specialization: row.specialization || null,
        researchAreas: row.researchAreas
          ? row.researchAreas.split('|').map((s) => s.trim()).filter(Boolean)
          : [],
        status: row.status || 'active',
      });

      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          errors.push({
            row: index + 1,
            field: issue.path.join('.'),
            message: issue.message,
          });
        }
        return;
      }

      const key = `${parsed.data.email}|${parsed.data.employeeId}|${parsed.data.facultyCode}`;
      if (seen.has(key)) {
        duplicates += 1;
        errors.push({ row: index + 1, message: 'Duplicate row in import file' });
        return;
      }
      seen.add(key);
      validRows += 1;
      if (sample.length < 5) sample.push(row);
    });

    return {
      totalRows: rows.length,
      validRows,
      invalidRows: rows.length - validRows,
      duplicates,
      errors,
      sample,
    };
  }

  async importFaculty(input: FacultyImportConfirmInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    await this.audit('faculty.import.started', actor, institutionId, null, {
      rows: input.rows.length,
      dryRun: input.dryRun,
    });

    const preview = this.previewImport(input.rows);
    if (input.dryRun) {
      return { ...preview, imported: 0, failed: preview.invalidRows, facultyIds: [] };
    }

    if (preview.invalidRows > 0) {
      throw new ValidationError(
        'Import validation failed',
        preview.errors.map((e) => ({
          field: `row.${e.row}${e.field ? `.${e.field}` : ''}`,
          code: 'IMPORT_ROW_INVALID',
          message: e.message,
        })),
      );
    }

    const createdIds: string[] = [];

    try {
      for (let i = 0; i < input.rows.length; i += 1) {
        const row = input.rows[i]!;
        const parsed = createFacultySchema.parse({
          employeeId: row.employeeId,
          facultyCode: row.facultyCode,
          firstName: row.firstName,
          middleName: row.middleName || null,
          lastName: row.lastName,
          email: row.email,
          designation: row.designation || 'assistant_professor',
          customDesignation: row.customDesignation || null,
          employmentType: row.employmentType || 'full_time',
          phone: row.phone || null,
          departmentId: row.departmentId || null,
          schoolId: row.schoolId || null,
          campusId: row.campusId || null,
          experienceYears: row.experienceYears ? Number(row.experienceYears) : 0,
          specialization: row.specialization || null,
          researchAreas: row.researchAreas
            ? row.researchAreas.split('|').map((s) => s.trim()).filter(Boolean)
            : [],
          status: row.status || 'active',
        });

        const existing = await facultyRepository.findDuplicates(institutionId, {
          employeeId: parsed.employeeId,
          facultyCode: parsed.facultyCode,
          email: parsed.email,
        });
        if (existing.length > 0) {
          throw new ConflictError(`Duplicate faculty at row ${i + 1}`);
        }

        const created = await this.create(parsed, actor);
        createdIds.push(String(created.id));
      }
    } catch (err) {
      for (const id of createdIds) {
        await facultyRepository.hardDelete(institutionId, id);
      }
      logger.error({ err, institutionId }, 'Faculty import rolled back');
      throw err;
    }

    await this.audit('faculty.import.completed', actor, institutionId, null, {
      imported: createdIds.length,
    });
    await this.audit('faculty.imported', actor, institutionId, null, {
      imported: createdIds.length,
    });
    await eventBus.publish(
      EVENTS.FACULTY_IMPORTED,
      { institutionId, count: createdIds.length },
      { actorId: actor.userId },
    );

    return {
      imported: createdIds.length,
      failed: 0,
      errors: [] as Array<{ row: number; message: string }>,
      facultyIds: createdIds,
      totalRows: preview.totalRows,
      validRows: preview.validRows,
      invalidRows: preview.invalidRows,
      duplicates: preview.duplicates,
      sample: preview.sample,
    };
  }

  async exportFaculty(query: FacultyExportQuery, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const list = await facultyRepository.list(institutionId, {
      q: query.q,
      status: query.status,
      campusId: query.campusId,
      schoolId: query.schoolId,
      departmentId: query.departmentId,
      designation: query.designation,
      employmentType: query.employmentType,
      includeDeleted: query.includeDeleted,
      page: 1,
      limit: 5000,
    });

    const rows: Array<Record<string, unknown>> = list.items.map((doc) => {
      const dto = toDto(doc);
      return {
        ...dto,
        researchAreas: Array.isArray(dto.researchAreas)
          ? (dto.researchAreas as string[]).join('|')
          : '',
      };
    });

    await this.audit('faculty.export', actor, institutionId, null, {
      format: query.format,
      count: rows.length,
    });
    await this.audit('faculty.exported', actor, institutionId, null, {
      format: query.format,
      count: rows.length,
    });

    const csv = rowsToCsv(rows);
    if (query.format === 'pdf') {
      const lines = rows.map(
        (r) =>
          `${String(r.fullName ?? '')} | ${String(r.employeeId ?? '')} | ${String(r.email ?? '')} | ${String(r.designation ?? '')}`,
      );
      const body = `Learnova Faculty Export\n\n${lines.join('\n')}\n`;
      return {
        contentType: 'application/pdf',
        filename: 'faculty-export.pdf',
        body: Buffer.from(
          `%PDF-1.1\n1 0 obj<<>>endobj\n2 0 obj<< /Length ${body.length} >>stream\n${body}\nendstream\nendobj\ntrailer<<>>\n%%EOF\n`,
        ),
      };
    }

    return {
      contentType:
        query.format === 'excel'
          ? 'application/vnd.ms-excel'
          : 'text/csv; charset=utf-8',
      filename: query.format === 'excel' ? 'faculty-export.xls' : 'faculty-export.csv',
      body: Buffer.from(csv, 'utf8'),
    };
  }

  async uploadPhoto(id: string, input: FacultyPhotoUploadInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const existing = await facultyRepository.findById(institutionId, id);
    if (!existing) throw new NotFoundError('Faculty not found');

    const canManage = actor.role === 'institution_admin' || actor.role === 'super_admin';
    const isSelf = existing.email.toLowerCase() === actor.email.toLowerCase();
    if (!canManage && !isSelf) {
      throw new ForbiddenError('Not allowed to update this profile photo');
    }

    const ext =
      input.contentType === 'image/png' ? 'png' : input.contentType === 'image/webp' ? 'webp' : 'jpg';
    const key = `faculty/${institutionId}/${id}/profile.${ext}`;
    const storage = getStorage();
    const stored = await storage.put({
      key,
      body: Buffer.from(input.data, 'base64'),
      contentType: input.contentType,
    });

    const profilePhoto = stored.url ?? key;
    const doc = await facultyRepository.updateById(institutionId, id, {
      profilePhoto,
      updatedBy: new Types.ObjectId(actor.userId),
    });
    if (!doc) throw new NotFoundError('Faculty not found');

    await this.audit('faculty.profile.updated', actor, institutionId, id, {
      profilePhoto: true,
    });
    return toDto(doc);
  }

  async removePhoto(id: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const existing = await facultyRepository.findById(institutionId, id);
    if (!existing) throw new NotFoundError('Faculty not found');

    const canManage = actor.role === 'institution_admin' || actor.role === 'super_admin';
    const isSelf = existing.email.toLowerCase() === actor.email.toLowerCase();
    if (!canManage && !isSelf) {
      throw new ForbiddenError('Not allowed to update this profile photo');
    }

    const doc = await facultyRepository.updateById(institutionId, id, {
      profilePhoto: null,
      updatedBy: new Types.ObjectId(actor.userId),
    });
    if (!doc) throw new NotFoundError('Faculty not found');
    await this.audit('faculty.profile.updated', actor, institutionId, id, {
      profilePhotoRemoved: true,
    });
    return toDto(doc);
  }
}

export const facultyService = new FacultyService();
