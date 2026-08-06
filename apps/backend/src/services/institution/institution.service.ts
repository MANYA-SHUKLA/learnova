import { Types } from 'mongoose';
import { createId } from '@learnova/utils';
import type {
  CreateAcademicCalendarInput,
  CreateAcademicYearInput,
  CreateBatchInput,
  CreateCampusInput,
  CreateDepartmentInput,
  CreateInstitutionInput,
  CreateProgramInput,
  CreateSchoolInput,
  CreateSectionInput,
  CreateSemesterInput,
  OrgListQuery,
  UpdateAcademicCalendarInput,
  UpdateAcademicYearInput,
  UpdateBatchInput,
  UpdateCampusInput,
  UpdateDepartmentInput,
  UpdateInstitutionInput,
  UpdateInstitutionSettingsInput,
  UpdateProgramInput,
  UpdateSchoolInput,
  UpdateSectionInput,
  UpdateSemesterInput,
} from '@learnova/validation';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../utils/errors/index.js';
import {
  academicCalendarRepository,
  academicYearRepository,
  batchRepository,
  campusRepository,
  departmentRepository,
  institutionAuditRepository,
  institutionRepository,
  institutionSettingsRepository,
  programRepository,
  schoolRepository,
  sectionRepository,
  semesterRepository,
  AcademicYearModel,
} from '../../repositories/institution/index.js';

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

function assertSameInstitution(actor: ActorContext, institutionId: string): void {
  if (actor.role === 'super_admin') return;
  if (actor.institutionId !== institutionId) {
    throw new ForbiddenError('Cross-institution access denied');
  }
}

function toDto<T extends { _id: Types.ObjectId; toObject?: () => Record<string, unknown> }>(
  doc: T,
): Record<string, unknown> {
  const raw =
    typeof doc.toObject === 'function'
      ? doc.toObject()
      : (doc as unknown as Record<string, unknown>);
  const { _id, __v, ...rest } = raw as Record<string, unknown> & {
    _id: Types.ObjectId;
    __v?: number;
  };
  return {
    id: String(_id),
    ...rest,
    createdAt:
      rest.createdAt instanceof Date
        ? rest.createdAt.toISOString()
        : (rest.createdAt as string | undefined),
    updatedAt:
      rest.updatedAt instanceof Date
        ? rest.updatedAt.toISOString()
        : (rest.updatedAt as string | undefined),
    deletedAt:
      rest.deletedAt instanceof Date
        ? rest.deletedAt.toISOString()
        : ((rest.deletedAt as string | null | undefined) ?? null),
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

async function audit(
  event: string,
  actor: ActorContext,
  institutionId: string | null,
  metadata?: Record<string, unknown>,
) {
  await institutionAuditRepository.log({
    event,
    institutionId,
    userId: actor.userId,
    email: actor.email,
    metadata,
  });
}

export class InstitutionService {
  async createInstitution(input: CreateInstitutionInput, actor: ActorContext) {
    const tenantId = requireTenant(actor);
    const existing = await institutionRepository.findById(tenantId);
    if (existing) {
      throw new ConflictError('Institution already exists for this account');
    }

    try {
      const doc = await institutionRepository.create({
        _id: new Types.ObjectId(tenantId),
        ...input,
        deletedAt: null,
      });
      await institutionSettingsRepository.getOrCreate(tenantId);
      await audit('institution.created', actor, tenantId, { name: input.name });
      return toDto(doc);
    } catch (err) {
      if ((err as { code?: number }).code === 11000) {
        throw new ConflictError('Institution slug, code, or email already exists');
      }
      throw err;
    }
  }

  async getMyInstitution(actor: ActorContext) {
    const tenantId = requireTenant(actor);
    const doc = await institutionRepository.findById(tenantId);
    if (!doc) throw new NotFoundError('Institution not found');
    return toDto(doc);
  }

  async getInstitution(id: string, actor: ActorContext) {
    assertSameInstitution(actor, id);
    const doc = await institutionRepository.findById(id);
    if (!doc) throw new NotFoundError('Institution not found');
    return toDto(doc);
  }

  async listInstitutions(query: OrgListQuery, actor: ActorContext) {
    if (actor.role !== 'super_admin') {
      const tenantId = requireTenant(actor);
      const doc = await institutionRepository.findById(tenantId);
      return {
        items: doc ? [toDto(doc)] : [],
        meta: pageMeta(doc ? 1 : 0, 1, query.limit),
      };
    }
    const result = await institutionRepository.list(query);
    return {
      items: result.items.map((d) => toDto(d)),
      meta: pageMeta(result.total, result.page, result.limit),
    };
  }

  async updateInstitution(id: string, input: UpdateInstitutionInput, actor: ActorContext) {
    assertSameInstitution(actor, id);
    const doc = await institutionRepository.updateById(id, input as Record<string, unknown>);
    if (!doc) throw new NotFoundError('Institution not found');
    await audit('institution.updated', actor, id, { fields: Object.keys(input) });
    return toDto(doc);
  }

  async archiveInstitution(id: string, actor: ActorContext) {
    assertSameInstitution(actor, id);
    const doc = await institutionRepository.softDelete(id);
    if (!doc) throw new NotFoundError('Institution not found');
    await audit('entity.archived', actor, id, { entity: 'institution' });
    return toDto(doc);
  }

  async restoreInstitution(id: string, actor: ActorContext) {
    assertSameInstitution(actor, id);
    const doc = await institutionRepository.restore(id);
    if (!doc) throw new NotFoundError('Institution not found');
    await audit('entity.restored', actor, id, { entity: 'institution' });
    return toDto(doc);
  }

  async updateBranding(
    id: string,
    input: { logo?: string | null; favicon?: string | null },
    actor: ActorContext,
  ) {
    assertSameInstitution(actor, id);
    const doc = await institutionRepository.updateById(id, input);
    if (!doc) throw new NotFoundError('Institution not found');
    await audit('institution.updated', actor, id, { branding: true });
    return toDto(doc);
  }

  // ---- generic tenant resource helpers ----

  private async createTenantResource(
    repo: {
      create: (data: Record<string, unknown>) => Promise<{ _id: Types.ObjectId }>;
    },
    actor: ActorContext,
    data: Record<string, unknown>,
    event: string,
  ) {
    const institutionId = requireTenant(actor);
    try {
      const doc = await repo.create({
        ...data,
        institutionId: new Types.ObjectId(institutionId),
        deletedAt: null,
      });
      await audit(event, actor, institutionId, { id: String(doc._id) });
      return toDto(doc as never);
    } catch (err) {
      if ((err as { code?: number }).code === 11000) {
        throw new ConflictError('Duplicate code or unique constraint failed');
      }
      throw err;
    }
  }

  private async listTenantResource(
    repo: {
      list: (
        institutionId: string,
        query: OrgListQuery,
      ) => Promise<{ items: Array<{ _id: Types.ObjectId }>; total: number; page: number; limit: number }>;
    },
    actor: ActorContext,
    query: OrgListQuery,
  ) {
    const institutionId = requireTenant(actor);
    const result = await repo.list(institutionId, query);
    return {
      items: result.items.map((d) => toDto(d as never)),
      meta: pageMeta(result.total, result.page, result.limit),
    };
  }

  private async getTenantResource(
    repo: {
      findById: (institutionId: string, id: string) => Promise<{ _id: Types.ObjectId } | null>;
    },
    actor: ActorContext,
    id: string,
  ) {
    const institutionId = requireTenant(actor);
    const doc = await repo.findById(institutionId, id);
    if (!doc) throw new NotFoundError('Resource not found');
    return toDto(doc as never);
  }

  private async updateTenantResource(
    repo: {
      updateById: (
        institutionId: string,
        id: string,
        data: Record<string, unknown>,
      ) => Promise<{ _id: Types.ObjectId } | null>;
    },
    actor: ActorContext,
    id: string,
    data: Record<string, unknown>,
    event: string,
  ) {
    const institutionId = requireTenant(actor);
    const doc = await repo.updateById(institutionId, id, data);
    if (!doc) throw new NotFoundError('Resource not found');
    await audit(event, actor, institutionId, { id });
    return toDto(doc as never);
  }

  private async archiveTenantResource(
    repo: {
      softDelete: (
        institutionId: string,
        id: string,
      ) => Promise<{ _id: Types.ObjectId } | null>;
    },
    actor: ActorContext,
    id: string,
    entity: string,
  ) {
    const institutionId = requireTenant(actor);
    const doc = await repo.softDelete(institutionId, id);
    if (!doc) throw new NotFoundError('Resource not found');
    await audit('entity.archived', actor, institutionId, { entity, id });
    return toDto(doc as never);
  }

  private async restoreTenantResource(
    repo: {
      restore: (
        institutionId: string,
        id: string,
      ) => Promise<{ _id: Types.ObjectId } | null>;
    },
    actor: ActorContext,
    id: string,
    entity: string,
  ) {
    const institutionId = requireTenant(actor);
    const doc = await repo.restore(institutionId, id);
    if (!doc) throw new NotFoundError('Resource not found');
    await audit('entity.restored', actor, institutionId, { entity, id });
    return toDto(doc as never);
  }

  // Campuses
  createCampus = (input: CreateCampusInput, actor: ActorContext) =>
    this.createTenantResource(campusRepository, actor, input as never, 'campus.created');
  listCampuses = (query: OrgListQuery, actor: ActorContext) =>
    this.listTenantResource(campusRepository, actor, query);
  getCampus = (id: string, actor: ActorContext) =>
    this.getTenantResource(campusRepository, actor, id);
  updateCampus = (id: string, input: UpdateCampusInput, actor: ActorContext) =>
    this.updateTenantResource(
      campusRepository,
      actor,
      id,
      input as never,
      'campus.updated',
    );
  archiveCampus = (id: string, actor: ActorContext) =>
    this.archiveTenantResource(campusRepository, actor, id, 'campus');
  restoreCampus = (id: string, actor: ActorContext) =>
    this.restoreTenantResource(campusRepository, actor, id, 'campus');

  // Schools
  createSchool = (input: CreateSchoolInput, actor: ActorContext) =>
    this.createTenantResource(schoolRepository, actor, input as never, 'school.created');
  listSchools = (query: OrgListQuery, actor: ActorContext) =>
    this.listTenantResource(schoolRepository, actor, query);
  getSchool = (id: string, actor: ActorContext) =>
    this.getTenantResource(schoolRepository, actor, id);
  updateSchool = (id: string, input: UpdateSchoolInput, actor: ActorContext) =>
    this.updateTenantResource(
      schoolRepository,
      actor,
      id,
      input as never,
      'school.updated',
    );
  archiveSchool = (id: string, actor: ActorContext) =>
    this.archiveTenantResource(schoolRepository, actor, id, 'school');
  restoreSchool = (id: string, actor: ActorContext) =>
    this.restoreTenantResource(schoolRepository, actor, id, 'school');

  // Departments
  async createDepartment(input: CreateDepartmentInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const school = await schoolRepository.findById(institutionId, input.schoolId);
    if (!school) throw new ValidationError('Invalid schoolId for this institution');
    return this.createTenantResource(
      departmentRepository,
      actor,
      input as never,
      'department.created',
    );
  }
  listDepartments = (query: OrgListQuery, actor: ActorContext) =>
    this.listTenantResource(departmentRepository, actor, query);
  getDepartment = (id: string, actor: ActorContext) =>
    this.getTenantResource(departmentRepository, actor, id);
  updateDepartment = (id: string, input: UpdateDepartmentInput, actor: ActorContext) =>
    this.updateTenantResource(
      departmentRepository,
      actor,
      id,
      input as never,
      'department.updated',
    );
  archiveDepartment = (id: string, actor: ActorContext) =>
    this.archiveTenantResource(departmentRepository, actor, id, 'department');
  restoreDepartment = (id: string, actor: ActorContext) =>
    this.restoreTenantResource(departmentRepository, actor, id, 'department');

  // Programs
  async createProgram(input: CreateProgramInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const dept = await departmentRepository.findById(institutionId, input.departmentId);
    if (!dept) throw new ValidationError('Invalid departmentId for this institution');
    return this.createTenantResource(
      programRepository,
      actor,
      input as never,
      'program.created',
    );
  }
  listPrograms = (query: OrgListQuery, actor: ActorContext) =>
    this.listTenantResource(programRepository, actor, query);
  getProgram = (id: string, actor: ActorContext) =>
    this.getTenantResource(programRepository, actor, id);
  updateProgram = (id: string, input: UpdateProgramInput, actor: ActorContext) =>
    this.updateTenantResource(
      programRepository,
      actor,
      id,
      input as never,
      'program.updated',
    );
  archiveProgram = (id: string, actor: ActorContext) =>
    this.archiveTenantResource(programRepository, actor, id, 'program');
  restoreProgram = (id: string, actor: ActorContext) =>
    this.restoreTenantResource(programRepository, actor, id, 'program');

  // Academic years
  async createAcademicYear(input: CreateAcademicYearInput, actor: ActorContext) {
    if (input.endDate <= input.startDate) {
      throw new ValidationError('endDate must be after startDate');
    }
    const institutionId = requireTenant(actor);
    if (input.isActive) {
      await AcademicYearModel.updateMany(
        { institutionId, deletedAt: null },
        { $set: { isActive: false } },
      ).exec();
    }
    return this.createTenantResource(
      academicYearRepository,
      actor,
      input as never,
      'academic_year.created',
    );
  }
  listAcademicYears = (query: OrgListQuery, actor: ActorContext) =>
    this.listTenantResource(academicYearRepository, actor, query);
  getAcademicYear = (id: string, actor: ActorContext) =>
    this.getTenantResource(academicYearRepository, actor, id);
  updateAcademicYear = (id: string, input: UpdateAcademicYearInput, actor: ActorContext) =>
    this.updateTenantResource(
      academicYearRepository,
      actor,
      id,
      input as never,
      'academic_year.updated',
    );
  archiveAcademicYear = (id: string, actor: ActorContext) =>
    this.archiveTenantResource(academicYearRepository, actor, id, 'academic_year');
  restoreAcademicYear = (id: string, actor: ActorContext) =>
    this.restoreTenantResource(academicYearRepository, actor, id, 'academic_year');

  // Semesters
  async createSemester(input: CreateSemesterInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const year = await academicYearRepository.findById(institutionId, input.academicYearId);
    if (!year) throw new ValidationError('Invalid academicYearId');
    return this.createTenantResource(
      semesterRepository,
      actor,
      input as never,
      'semester.created',
    );
  }
  listSemesters = (query: OrgListQuery, actor: ActorContext) =>
    this.listTenantResource(semesterRepository, actor, query);
  getSemester = (id: string, actor: ActorContext) =>
    this.getTenantResource(semesterRepository, actor, id);
  updateSemester = (id: string, input: UpdateSemesterInput, actor: ActorContext) =>
    this.updateTenantResource(
      semesterRepository,
      actor,
      id,
      input as never,
      'semester.updated',
    );
  archiveSemester = (id: string, actor: ActorContext) =>
    this.archiveTenantResource(semesterRepository, actor, id, 'semester');
  restoreSemester = (id: string, actor: ActorContext) =>
    this.restoreTenantResource(semesterRepository, actor, id, 'semester');

  // Sections
  async createSection(input: CreateSectionInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const [program, semester] = await Promise.all([
      programRepository.findById(institutionId, input.programId),
      semesterRepository.findById(institutionId, input.semesterId),
    ]);
    if (!program || !semester) {
      throw new ValidationError('Invalid programId or semesterId');
    }
    return this.createTenantResource(
      sectionRepository,
      actor,
      input as never,
      'section.created',
    );
  }
  listSections = (query: OrgListQuery, actor: ActorContext) =>
    this.listTenantResource(sectionRepository, actor, query);
  getSection = (id: string, actor: ActorContext) =>
    this.getTenantResource(sectionRepository, actor, id);
  updateSection = (id: string, input: UpdateSectionInput, actor: ActorContext) =>
    this.updateTenantResource(
      sectionRepository,
      actor,
      id,
      input as never,
      'section.updated',
    );
  archiveSection = (id: string, actor: ActorContext) =>
    this.archiveTenantResource(sectionRepository, actor, id, 'section');
  restoreSection = (id: string, actor: ActorContext) =>
    this.restoreTenantResource(sectionRepository, actor, id, 'section');

  // Batches
  async createBatch(input: CreateBatchInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const program = await programRepository.findById(institutionId, input.programId);
    if (!program) throw new ValidationError('Invalid programId');
    return this.createTenantResource(
      batchRepository,
      actor,
      input as never,
      'batch.created',
    );
  }
  listBatches = (query: OrgListQuery, actor: ActorContext) =>
    this.listTenantResource(batchRepository, actor, query);
  getBatch = (id: string, actor: ActorContext) =>
    this.getTenantResource(batchRepository, actor, id);
  updateBatch = (id: string, input: UpdateBatchInput, actor: ActorContext) =>
    this.updateTenantResource(batchRepository, actor, id, input as never, 'batch.updated');
  archiveBatch = (id: string, actor: ActorContext) =>
    this.archiveTenantResource(batchRepository, actor, id, 'batch');
  restoreBatch = (id: string, actor: ActorContext) =>
    this.restoreTenantResource(batchRepository, actor, id, 'batch');

  // Academic calendars
  async createAcademicCalendar(input: CreateAcademicCalendarInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const year = await academicYearRepository.findById(institutionId, input.academicYearId);
    if (!year) throw new ValidationError('Invalid academicYearId');
    const events = (input.events ?? []).map((e) => ({
      ...e,
      id: e.id ?? createId(),
    }));
    return this.createTenantResource(
      academicCalendarRepository,
      actor,
      { ...input, events },
      'calendar.updated',
    );
  }
  listAcademicCalendars = (query: OrgListQuery, actor: ActorContext) =>
    this.listTenantResource(academicCalendarRepository, actor, query);
  getAcademicCalendar = (id: string, actor: ActorContext) =>
    this.getTenantResource(academicCalendarRepository, actor, id);
  async updateAcademicCalendar(
    id: string,
    input: UpdateAcademicCalendarInput,
    actor: ActorContext,
  ) {
    const payload = { ...input } as Record<string, unknown>;
    if (input.events) {
      payload.events = input.events.map((e) => ({
        ...e,
        id: e.id ?? createId(),
      }));
    }
    return this.updateTenantResource(
      academicCalendarRepository,
      actor,
      id,
      payload,
      'calendar.updated',
    );
  }
  archiveAcademicCalendar = (id: string, actor: ActorContext) =>
    this.archiveTenantResource(academicCalendarRepository, actor, id, 'academic_calendar');
  restoreAcademicCalendar = (id: string, actor: ActorContext) =>
    this.restoreTenantResource(academicCalendarRepository, actor, id, 'academic_calendar');

  // Settings
  async getSettings(actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const doc = await institutionSettingsRepository.getOrCreate(institutionId);
    return toDto(doc);
  }

  async updateSettings(input: UpdateInstitutionSettingsInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const doc = await institutionSettingsRepository.update(
      institutionId,
      input as Record<string, unknown>,
    );
    await audit('settings.updated', actor, institutionId, { fields: Object.keys(input) });
    return toDto(doc!);
  }
}

export const institutionService = new InstitutionService();
