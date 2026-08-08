import { Types } from 'mongoose';
import { EVENTS } from '@learnova/events';
import type {
  CreateStudentInput,
  StudentBulkAssignBatchInput,
  StudentBulkAssignDepartmentInput,
  StudentBulkAssignSectionInput,
  StudentBulkAssignSemesterInput,
  StudentBulkIdsInput,
  StudentBulkStatusInput,
  StudentExportQuery,
  StudentImportConfirmInput,
  StudentListQuery,
  StudentPhotoUploadInput,
  UpdateStudentInput,
  UpdateStudentProfileInput,
} from '@learnova/validation';
import { createStudentSchema } from '@learnova/validation';
import { eventBus } from '../../events/index.js';
import { DepartmentModel } from '../../models/department.model.js';
import { ProgramModel } from '../../models/program.model.js';
import { BatchModel } from '../../models/batch.model.js';
import { SectionModel } from '../../models/section.model.js';
import { getStorage } from '../../storage/index.js';
import { logger } from '../../utils/logger/index.js';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../utils/errors/index.js';
import { studentRepository } from '../../repositories/student/index.js';
import {
  assertStudentSelfAccess,
  buildFacultyStudentFilter,
  facultyCanAccessStudent,
  scopeStudentSelfFilter,
} from '../access/faculty-scope.js';
import { resolveStudentCreateIds } from '../id/entity-id.helpers.js';

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

const CSV_HEADERS = [
  'studentId',
  'admissionNumber',
  'rollNumber',
  'registrationNumber',
  'firstName',
  'middleName',
  'lastName',
  'email',
  'phone',
  'campusId',
  'schoolId',
  'departmentId',
  'programId',
  'academicYearId',
  'semesterId',
  'sectionId',
  'batchId',
  'yearOfStudy',
  'currentSemester',
  'admissionDate',
  'status',
  'scholarship',
  'hostelResident',
  'transportRequired',
  'guardianName',
  'guardianPhone',
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

async function applyStudentListScope(
  filter: Record<string, unknown>,
  actor: ActorContext,
  institutionId: string,
): Promise<Record<string, unknown>> {
  filter = await buildFacultyStudentFilter(filter, actor, institutionId);
  filter = await scopeStudentSelfFilter(filter, actor, institutionId);
  return filter;
}

export class StudentService {
  private async audit(
    event: Parameters<typeof studentRepository.logAudit>[0]['event'],
    actor: ActorContext,
    institutionId: string,
    studentId?: string | null,
    metadata?: Record<string, unknown>,
  ) {
    await studentRepository.logAudit({
      event,
      institutionId,
      studentId,
      userId: actor.userId,
      email: actor.email,
      metadata,
    });
  }

  async create(input: CreateStudentInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const { studentId, admissionNumber } = await resolveStudentCreateIds(institutionId, input);
    const duplicates = await studentRepository.findDuplicates(institutionId, {
      studentId,
      admissionNumber,
      email: input.email,
    });
    if (duplicates.length > 0) {
      throw new ConflictError(
        'Student with same student ID, admission number, or email already exists',
      );
    }

    const fullName = buildFullName(input.firstName, input.middleName, input.lastName);
    const doc = await studentRepository.create({
      ...input,
      studentId,
      admissionNumber,
      email: input.email.toLowerCase(),
      fullName,
      campusId: input.campusId ? new Types.ObjectId(input.campusId) : null,
      schoolId: input.schoolId ? new Types.ObjectId(input.schoolId) : null,
      departmentId: input.departmentId ? new Types.ObjectId(input.departmentId) : null,
      programId: input.programId ? new Types.ObjectId(input.programId) : null,
      academicYearId: input.academicYearId ? new Types.ObjectId(input.academicYearId) : null,
      semesterId: input.semesterId ? new Types.ObjectId(input.semesterId) : null,
      sectionId: input.sectionId ? new Types.ObjectId(input.sectionId) : null,
      batchId: input.batchId ? new Types.ObjectId(input.batchId) : null,
      institutionId: new Types.ObjectId(institutionId),
      createdBy: new Types.ObjectId(actor.userId),
      updatedBy: new Types.ObjectId(actor.userId),
      deletedAt: null,
      isActive: input.status === 'active',
    });

    await this.audit('student.created', actor, institutionId, String(doc._id));
    await eventBus.publish(
      EVENTS.STUDENT_CREATED,
      {
        studentId: String(doc._id),
        institutionId,
      },
      { actorId: actor.userId },
    );

    let credentials: {
      email: string;
      temporaryPassword: string;
      studentId: string;
      admissionNumber: string;
    } | null = null;

    try {
      const { provisionLoginUser } = await import('../users/provision-login-user.js');
      const provisioned = await provisionLoginUser({
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        institutionId,
        role: 'student',
      });
      if (provisioned.created && provisioned.temporaryPassword) {
        credentials = {
          email: input.email.toLowerCase(),
          temporaryPassword: provisioned.temporaryPassword,
          studentId,
          admissionNumber,
        };
        const { sendCredentialsEmail } = await import('../../mail/credentials-email.js');
        void sendCredentialsEmail({
          to: credentials.email,
          firstName: input.firstName,
          role: 'student',
          temporaryPassword: credentials.temporaryPassword,
          displayIdLabel: 'Student ID',
          displayId: credentials.studentId,
        });
      }
    } catch (err) {
      logger.warn({ err, email: input.email }, 'Student login user provisioning skipped/failed');
    }

    const dto = toDto(doc) as { id: string } & Record<string, unknown>;
    return {
      ...dto,
      credentials,
    };
  }

  async list(query: StudentListQuery, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    let filter = studentRepository.buildFilter(institutionId, query);
    filter = await applyStudentListScope(filter, actor, institutionId);

    const result = await studentRepository.listByFilter(
      filter,
      query.page,
      query.limit,
      query.sortBy,
      query.sortOrder,
    );

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
    const doc = await studentRepository.findByIdIncludingDeleted(institutionId, id);
    if (!doc) throw new NotFoundError('Student not found');

    if (actor.role === 'faculty') {
      const allowed = await facultyCanAccessStudent(institutionId, actor.email, id);
      if (!allowed) {
        throw new ForbiddenError('Not allowed to access this student');
      }
    }

    await assertStudentSelfAccess(institutionId, actor, id);

    return toDto(doc);
  }

  async update(id: string, input: UpdateStudentInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const existing = await studentRepository.findById(institutionId, id);
    if (!existing) throw new NotFoundError('Student not found');

    if (input.studentId || input.admissionNumber || input.email) {
      const duplicates = await studentRepository.findDuplicates(institutionId, {
        studentId: input.studentId,
        admissionNumber: input.admissionNumber,
        email: input.email,
      });
      const conflict = duplicates.find((d) => String(d._id) !== id);
      if (conflict) {
        throw new ConflictError(
          'Student with same student ID, admission number, or email already exists',
        );
      }
    }

    const patch: Record<string, unknown> = {
      ...input,
      updatedBy: new Types.ObjectId(actor.userId),
    };
    if (input.email) patch.email = input.email.toLowerCase();
    if (input.campusId !== undefined) {
      patch.campusId = input.campusId ? new Types.ObjectId(input.campusId) : null;
    }
    if (input.schoolId !== undefined) {
      patch.schoolId = input.schoolId ? new Types.ObjectId(input.schoolId) : null;
    }
    if (input.departmentId !== undefined) {
      patch.departmentId = input.departmentId ? new Types.ObjectId(input.departmentId) : null;
    }
    if (input.programId !== undefined) {
      patch.programId = input.programId ? new Types.ObjectId(input.programId) : null;
    }
    if (input.academicYearId !== undefined) {
      patch.academicYearId = input.academicYearId
        ? new Types.ObjectId(input.academicYearId)
        : null;
    }
    if (input.semesterId !== undefined) {
      patch.semesterId = input.semesterId ? new Types.ObjectId(input.semesterId) : null;
    }
    if (input.sectionId !== undefined) {
      patch.sectionId = input.sectionId ? new Types.ObjectId(input.sectionId) : null;
    }
    if (input.batchId !== undefined) {
      patch.batchId = input.batchId ? new Types.ObjectId(input.batchId) : null;
    }

    const firstName = input.firstName ?? existing.firstName;
    const middleName =
      input.middleName !== undefined ? input.middleName : existing.middleName;
    const lastName = input.lastName ?? existing.lastName;
    if (input.firstName || input.middleName !== undefined || input.lastName) {
      patch.fullName = buildFullName(firstName, middleName, lastName);
    }

    if (input.status) {
      patch.isActive = input.status === 'active';
    }

    const doc = await studentRepository.updateById(institutionId, id, patch);
    if (!doc) throw new NotFoundError('Student not found');

    const statusChanged = input.status && input.status !== existing.status;
    await this.audit(
      statusChanged ? 'student.status.changed' : 'student.updated',
      actor,
      institutionId,
      id,
      statusChanged ? { status: input.status } : { fields: Object.keys(input) },
    );

    await eventBus.publish(
      EVENTS.STUDENT_UPDATED,
      { studentId: id, institutionId },
      {
        actorId: actor.userId,
      },
    );
    if (statusChanged && input.status) {
      await eventBus.publish(
        EVENTS.STUDENT_STATUS_CHANGED,
        { studentId: id, institutionId, status: input.status },
        { actorId: actor.userId },
      );
    }

    return toDto(doc);
  }

  async getOwnProfile(actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const existing = await studentRepository.findByEmail(institutionId, actor.email);
    if (!existing) throw new NotFoundError('Student profile not found for this account');
    return toDto(existing);
  }

  async updateOwnProfile(input: UpdateStudentProfileInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const existing = await studentRepository.findByEmail(institutionId, actor.email);
    if (!existing) throw new NotFoundError('Student profile not found for this account');

    const doc = await studentRepository.updateById(institutionId, String(existing._id), {
      ...input,
      updatedBy: new Types.ObjectId(actor.userId),
    });
    if (!doc) throw new NotFoundError('Student not found');

    await this.audit('student.profile.updated', actor, institutionId, String(doc._id), {
      fields: Object.keys(input),
    });
    await eventBus.publish(
      EVENTS.STUDENT_UPDATED,
      { studentId: String(doc._id), institutionId },
      { actorId: actor.userId },
    );
    return toDto(doc);
  }

  async archive(id: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const doc = await studentRepository.softDelete(institutionId, id);
    if (!doc) throw new NotFoundError('Student not found');
    await this.audit('student.archived', actor, institutionId, id);
    await eventBus.publish(
      EVENTS.STUDENT_DELETED,
      { studentId: id, institutionId },
      {
        actorId: actor.userId,
      },
    );
    return toDto(doc);
  }

  async restore(id: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const doc = await studentRepository.restore(institutionId, id);
    if (!doc) throw new NotFoundError('Student not found');
    await this.audit('student.restored', actor, institutionId, id);
    await eventBus.publish(
      EVENTS.STUDENT_STATUS_CHANGED,
      { studentId: id, institutionId, status: 'active' },
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
    if (actor.role === 'student' || actor.role === 'faculty') {
      throw new ForbiddenError('Institution-wide student stats require admin access');
    }
    const raw = await studentRepository.stats(institutionId);

    const departmentIds = raw.byDepartment
      .map((d) => d._id)
      .filter(Boolean)
      .map(String);

    const programIds = raw.byProgram
      .map((d) => d._id)
      .filter(Boolean)
      .map(String);

    const batchIds = raw.byBatch
      .map((d) => d._id)
      .filter(Boolean)
      .map(String);

    const sectionIds = raw.bySection
      .map((d) => d._id)
      .filter(Boolean)
      .map(String);

    const [departments, programs, batches, sections] = await Promise.all([
      departmentIds.length > 0
        ? DepartmentModel.find({ _id: { $in: departmentIds } }).exec()
        : [],
      programIds.length > 0 ? ProgramModel.find({ _id: { $in: programIds } }).exec() : [],
      batchIds.length > 0 ? BatchModel.find({ _id: { $in: batchIds } }).exec() : [],
      sectionIds.length > 0 ? SectionModel.find({ _id: { $in: sectionIds } }).exec() : [],
    ]);

    const deptName = new Map(departments.map((d) => [String(d._id), d.name]));
    const progName = new Map(programs.map((p) => [String(p._id), p.name]));
    const batchName = new Map(batches.map((b) => [String(b._id), b.name]));
    const sectionName = new Map(sections.map((s) => [String(s._id), s.name]));

    return {
      total: raw.total,
      active: raw.active,
      inactive: raw.inactive,
      suspended: raw.suspended,
      graduated: raw.graduated,
      dropped: raw.dropped,
      transferred: raw.transferred,
      archived: raw.archived,
      scholarshipCount: raw.scholarshipCount,
      newThisMonth: raw.newThisMonth,
      byDepartment: raw.byDepartment.map((d) => ({
        departmentId: d._id ? String(d._id) : null,
        label: d._id ? (deptName.get(String(d._id)) ?? 'Unknown') : 'Unassigned',
        count: d.count as number,
      })),
      byProgram: raw.byProgram.map((d) => ({
        programId: d._id ? String(d._id) : null,
        label: d._id ? (progName.get(String(d._id)) ?? 'Unknown') : 'Unassigned',
        count: d.count as number,
      })),
      byBatch: raw.byBatch.map((d) => ({
        batchId: d._id ? String(d._id) : null,
        label: d._id ? (batchName.get(String(d._id)) ?? 'Unknown') : 'Unassigned',
        count: d.count as number,
      })),
      bySection: raw.bySection.map((d) => ({
        sectionId: d._id ? String(d._id) : null,
        label: d._id ? (sectionName.get(String(d._id)) ?? 'Unknown') : 'Unassigned',
        count: d.count as number,
      })),
      byStatus: raw.byStatus.map((d) => ({
        status: d._id as string,
        count: d.count as number,
      })),
      recentAdmissions: raw.recentAdmissions.map((doc) => ({
        id: String(doc._id),
        fullName: doc.fullName,
        studentId: doc.studentId,
        admissionNumber: doc.admissionNumber,
        admissionDate:
          doc.admissionDate instanceof Date
            ? doc.admissionDate.toISOString()
            : doc.admissionDate
              ? String(doc.admissionDate)
              : null,
        programId: doc.programId ? String(doc.programId) : null,
      })),
    };
  }

  async listAudit(studentId: string | undefined, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const items = await studentRepository.listAudit(institutionId, studentId, 100);
    return items.map((item) => ({
      id: String(item._id),
      event: item.event,
      studentId: item.studentId ? String(item.studentId) : null,
      userId: item.userId ? String(item.userId) : null,
      email: item.email,
      metadata: item.metadata,
      createdAt:
        item.createdAt instanceof Date
          ? item.createdAt.toISOString()
          : String(item.createdAt),
    }));
  }

  async bulkArchive(input: StudentBulkIdsInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const modified = await studentRepository.bulkArchive(institutionId, input.ids);
    await this.audit('student.archived', actor, institutionId, null, {
      bulk: true,
      ids: input.ids,
      modified,
    });
    return { modified };
  }

  async bulkActivate(input: StudentBulkIdsInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const modified = await studentRepository.bulkUpdateStatus(
      institutionId,
      input.ids,
      'active',
    );
    await this.audit('student.status.changed', actor, institutionId, null, {
      bulk: true,
      status: 'active',
      ids: input.ids,
      modified,
    });
    return { modified };
  }

  async bulkSuspend(input: StudentBulkIdsInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const modified = await studentRepository.bulkUpdateStatus(
      institutionId,
      input.ids,
      'suspended',
    );
    await this.audit('student.status.changed', actor, institutionId, null, {
      bulk: true,
      status: 'suspended',
      ids: input.ids,
      modified,
    });
    return { modified };
  }

  async bulkStatus(input: StudentBulkStatusInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const modified = await studentRepository.bulkUpdateStatus(
      institutionId,
      input.ids,
      input.status,
    );
    await this.audit('student.status.changed', actor, institutionId, null, {
      bulk: true,
      status: input.status,
      ids: input.ids,
      modified,
    });
    return { modified };
  }

  async bulkAssignDepartment(input: StudentBulkAssignDepartmentInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const modified = await studentRepository.bulkAssignDepartment(
      institutionId,
      input.ids,
      input.departmentId,
      input.schoolId,
      input.campusId,
      input.programId,
    );
    await this.audit('student.updated', actor, institutionId, null, {
      bulk: true,
      action: 'assign_department',
      departmentId: input.departmentId,
      modified,
    });
    return { modified };
  }

  async bulkAssignSection(input: StudentBulkAssignSectionInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const modified = await studentRepository.bulkAssignSection(
      institutionId,
      input.ids,
      input.sectionId,
    );
    await this.audit('student.updated', actor, institutionId, null, {
      bulk: true,
      action: 'assign_section',
      sectionId: input.sectionId,
      modified,
    });
    return { modified };
  }

  async bulkAssignSemester(input: StudentBulkAssignSemesterInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const modified = await studentRepository.bulkAssignSemester(institutionId, input.ids, {
      semesterId: input.semesterId,
      academicYearId: input.academicYearId,
      currentSemester: input.currentSemester,
    });
    await this.audit('student.updated', actor, institutionId, null, {
      bulk: true,
      action: 'assign_semester',
      semesterId: input.semesterId,
      academicYearId: input.academicYearId,
      modified,
    });
    return { modified };
  }

  async bulkAssignBatch(input: StudentBulkAssignBatchInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const modified = await studentRepository.bulkAssignBatch(
      institutionId,
      input.ids,
      input.batchId,
    );
    await this.audit('student.updated', actor, institutionId, null, {
      bulk: true,
      action: 'assign_batch',
      batchId: input.batchId,
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
      const parsed = createStudentSchema.safeParse({
        studentId: row.studentId?.trim() || undefined,
        admissionNumber: row.admissionNumber?.trim() || undefined,
        rollNumber: row.rollNumber || null,
        registrationNumber: row.registrationNumber || null,
        firstName: row.firstName,
        middleName: row.middleName || null,
        lastName: row.lastName,
        email: row.email,
        phone: row.phone || null,
        campusId: row.campusId || null,
        schoolId: row.schoolId || null,
        departmentId: row.departmentId || null,
        programId: row.programId || null,
        academicYearId: row.academicYearId || null,
        semesterId: row.semesterId || null,
        sectionId: row.sectionId || null,
        batchId: row.batchId || null,
        yearOfStudy: row.yearOfStudy ? Number(row.yearOfStudy) : null,
        currentSemester: row.currentSemester ? Number(row.currentSemester) : null,
        admissionDate: row.admissionDate || null,
        status: row.status || 'active',
        scholarship: row.scholarship === 'true' || row.scholarship === '1',
        hostelResident: row.hostelResident === 'true' || row.hostelResident === '1',
        transportRequired: row.transportRequired === 'true' || row.transportRequired === '1',
        guardianName: row.guardianName || null,
        guardianPhone: row.guardianPhone || null,
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

      const key = `${parsed.data.email}|${parsed.data.studentId ?? ''}|${parsed.data.admissionNumber ?? ''}`;
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

  async importStudents(input: StudentImportConfirmInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    await this.audit('student.import.started', actor, institutionId, null, {
      rows: input.rows.length,
      dryRun: input.dryRun,
    });

    const preview = this.previewImport(input.rows);
    if (input.dryRun) {
      return { ...preview, imported: 0, failed: preview.invalidRows, studentIds: [] };
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
    let emailed = 0;

    try {
      for (let i = 0; i < input.rows.length; i += 1) {
        const row = input.rows[i]!;
        const parsed = createStudentSchema.parse({
          studentId: row.studentId?.trim() || undefined,
          admissionNumber: row.admissionNumber?.trim() || undefined,
          rollNumber: row.rollNumber || null,
          registrationNumber: row.registrationNumber || null,
          firstName: row.firstName,
          middleName: row.middleName || null,
          lastName: row.lastName,
          email: row.email,
          phone: row.phone || null,
          campusId: row.campusId || null,
          schoolId: row.schoolId || null,
          departmentId: row.departmentId || null,
          programId: row.programId || null,
          academicYearId: row.academicYearId || null,
          semesterId: row.semesterId || null,
          sectionId: row.sectionId || null,
          batchId: row.batchId || null,
          yearOfStudy: row.yearOfStudy ? Number(row.yearOfStudy) : null,
          currentSemester: row.currentSemester ? Number(row.currentSemester) : null,
          admissionDate: row.admissionDate || null,
          status: row.status || 'active',
          scholarship: row.scholarship === 'true' || row.scholarship === '1',
          hostelResident: row.hostelResident === 'true' || row.hostelResident === '1',
          transportRequired: row.transportRequired === 'true' || row.transportRequired === '1',
          guardianName: row.guardianName || null,
          guardianPhone: row.guardianPhone || null,
        });

        const existing = await studentRepository.findDuplicates(institutionId, {
          studentId: parsed.studentId ?? '',
          admissionNumber: parsed.admissionNumber ?? '',
          email: parsed.email,
        });
        if (existing.length > 0 && (parsed.studentId || parsed.admissionNumber)) {
          throw new ConflictError(`Duplicate student at row ${i + 1}`);
        }

        const created = await this.create(parsed, actor);
        createdIds.push(created.id);
        if (created.credentials) {
          emailed += 1;
        }
      }
    } catch (err) {
      for (const id of createdIds) {
        const existing = await studentRepository.findByIdIncludingDeleted(institutionId, id);
        if (existing?.email) {
          try {
            const { userRepository } = await import('../../repositories/auth/index.js');
            const loginUser = await userRepository.findByEmail(existing.email);
            if (loginUser) {
              await userRepository.deleteById(String(loginUser._id));
            }
          } catch (cleanupErr) {
            logger.warn({ cleanupErr, studentId: id }, 'Orphan login cleanup after import rollback failed');
          }
        }
        await studentRepository.hardDelete(institutionId, id);
      }
      logger.error({ err, institutionId }, 'Student import rolled back');
      throw err;
    }

    await this.audit('student.import.completed', actor, institutionId, null, {
      imported: createdIds.length,
      credentialsEmailed: emailed,
    });
    await this.audit('student.imported', actor, institutionId, null, {
      imported: createdIds.length,
    });
    await eventBus.publish(
      EVENTS.STUDENT_IMPORTED,
      { institutionId, count: createdIds.length },
      { actorId: actor.userId },
    );

    return {
      imported: createdIds.length,
      failed: 0,
      errors: [] as Array<{ row: number; message: string }>,
      studentIds: createdIds,
      credentialsEmailed: emailed,
      totalRows: preview.totalRows,
      validRows: preview.validRows,
      invalidRows: preview.invalidRows,
      duplicates: preview.duplicates,
      sample: preview.sample,
    };
  }

  async exportStudents(query: StudentExportQuery, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    let filter = studentRepository.buildFilter(institutionId, {
      q: query.q,
      status: query.status,
      campusId: query.campusId,
      schoolId: query.schoolId,
      departmentId: query.departmentId,
      programId: query.programId,
      academicYearId: query.academicYearId,
      semesterId: query.semesterId,
      sectionId: query.sectionId,
      batchId: query.batchId,
      yearOfStudy: query.yearOfStudy,
      scholarship: query.scholarship,
      includeDeleted: query.includeDeleted,
      page: 1,
      limit: 5000,
    });
    filter = await applyStudentListScope(filter, actor, institutionId);

    const list = await studentRepository.listByFilter(filter, 1, 5000);

    const rows: Array<Record<string, unknown>> = list.items.map((doc) => toDto(doc));

    await this.audit('student.export', actor, institutionId, null, {
      format: query.format,
      count: rows.length,
    });
    await this.audit('student.exported', actor, institutionId, null, {
      format: query.format,
      count: rows.length,
    });

    const csv = rowsToCsv(rows);
    if (query.format === 'pdf') {
      const lines = rows.map(
        (r) =>
          `${String(r.fullName ?? '')} | ${String(r.studentId ?? '')} | ${String(r.email ?? '')} | ${String(r.admissionNumber ?? '')}`,
      );
      const body = `Learnova Student Export\n\n${lines.join('\n')}\n`;
      return {
        contentType: 'application/pdf',
        filename: 'student-export.pdf',
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
      filename: query.format === 'excel' ? 'student-export.xls' : 'student-export.csv',
      body: Buffer.from(csv, 'utf8'),
    };
  }

  async uploadPhoto(id: string, input: StudentPhotoUploadInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const existing = await studentRepository.findById(institutionId, id);
    if (!existing) throw new NotFoundError('Student not found');

    const canManage = actor.role === 'institution_admin' || actor.role === 'super_admin';
    const isSelf = existing.email.toLowerCase() === actor.email.toLowerCase();
    if (!canManage && !isSelf) {
      throw new ForbiddenError('Not allowed to update this profile photo');
    }

    const ext =
      input.contentType === 'image/png'
        ? 'png'
        : input.contentType === 'image/webp'
          ? 'webp'
          : 'jpg';
    const key = `students/${institutionId}/${id}/profile.${ext}`;
    const storage = getStorage();
    const stored = await storage.put({
      key,
      body: Buffer.from(input.data, 'base64'),
      contentType: input.contentType,
    });

    const profilePhoto = stored.url ?? key;
    const doc = await studentRepository.updateById(institutionId, id, {
      profilePhoto,
      updatedBy: new Types.ObjectId(actor.userId),
    });
    if (!doc) throw new NotFoundError('Student not found');

    await this.audit('student.profile.updated', actor, institutionId, id, {
      profilePhoto: true,
    });
    return toDto(doc);
  }

  async removePhoto(id: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const existing = await studentRepository.findById(institutionId, id);
    if (!existing) throw new NotFoundError('Student not found');

    const canManage = actor.role === 'institution_admin' || actor.role === 'super_admin';
    const isSelf = existing.email.toLowerCase() === actor.email.toLowerCase();
    if (!canManage && !isSelf) {
      throw new ForbiddenError('Not allowed to update this profile photo');
    }

    const doc = await studentRepository.updateById(institutionId, id, {
      profilePhoto: null,
      updatedBy: new Types.ObjectId(actor.userId),
    });
    if (!doc) throw new NotFoundError('Student not found');
    await this.audit('student.profile.updated', actor, institutionId, id, {
      profilePhotoRemoved: true,
    });
    return toDto(doc);
  }
}

export const studentService = new StudentService();
