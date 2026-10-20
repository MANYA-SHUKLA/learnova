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
import { INSTITUTION_MAX_STUDENTS, REGEX } from '@learnova/constants';
import {
  computeExpectedGraduationDate,
  DEFAULT_PROGRAM_DURATION_YEARS,
} from '@learnova/utils';
import { createStudentSchema } from '@learnova/validation';
import { eventBus } from '../../events/index.js';
import { DepartmentModel } from '../../models/department.model.js';
import { ProgramModel } from '../../models/program.model.js';
import { BatchModel } from '../../models/batch.model.js';
import { SectionModel } from '../../models/section.model.js';
import { SemesterModel } from '../../models/semester.model.js';
import { AcademicYearModel } from '../../models/academic-year.model.js';
import { getStorage } from '../../storage/index.js';
import { logger } from '../../utils/logger/index.js';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../utils/errors/index.js';
import { studentRepository } from '../../repositories/student/index.js';
import { isExcludedSoeDepartmentCode } from '../institution/soe-faculty-departments.js';
import {
  assertStudentSelfAccess,
  buildFacultyStudentFilter,
  facultyCanAccessStudent,
  scopeStudentSelfFilter,
} from '../access/faculty-scope.js';
import { resolveStudentCreateIds } from '../id/entity-id.helpers.js';
import { syncSemesterCalendar } from '../institution/sync-semester-calendar.js';

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
  private async resolveProgramDurationYears(
    institutionId: string,
    programId: string | null | undefined,
    explicit?: number | null,
  ): Promise<number | null> {
    if (explicit != null && explicit > 0) return explicit;
    if (!programId) return null;
    const program = await ProgramModel.findOne({
      _id: programId,
      institutionId: new Types.ObjectId(institutionId),
      deletedAt: null,
    })
      .select('durationYears')
      .lean()
      .exec();
    return program?.durationYears ?? null;
  }

  private computeExpectedGraduationForStudent(input: {
    yearOfStudy: number | null | undefined;
    programDuration: number | null | undefined;
    admissionDate?: Date | null;
    existingExpected?: Date | null;
    force?: boolean;
  }): Date | null {
    const { yearOfStudy, programDuration, admissionDate, existingExpected, force } = input;
    if (yearOfStudy == null || yearOfStudy < 1) return existingExpected ?? null;
    if (!force && existingExpected) return existingExpected;
    const duration = programDuration ?? DEFAULT_PROGRAM_DURATION_YEARS;
    return computeExpectedGraduationDate({
      yearOfStudy,
      programDuration: duration,
      admissionDate: admissionDate ?? null,
      fromDate: new Date(),
    });
  }

  private async syncExpectedGraduationForStudents(institutionId: string, ids: string[]) {
    if (ids.length === 0) return;
    const students = await studentRepository.findByIds(institutionId, ids);
    for (const student of students) {
      const programId = student.programId ? String(student.programId) : null;
      const resolvedDuration = await this.resolveProgramDurationYears(
        institutionId,
        programId,
        student.programDuration,
      );
      const programDuration =
        resolvedDuration ?? student.programDuration ?? DEFAULT_PROGRAM_DURATION_YEARS;
      const expectedGraduationDate = this.computeExpectedGraduationForStudent({
        yearOfStudy: student.yearOfStudy,
        programDuration,
        admissionDate: student.admissionDate,
        existingExpected: student.expectedGraduationDate,
        force: true,
      });
      const patch: Record<string, unknown> = {};
      if (programDuration !== student.programDuration) {
        patch.programDuration = programDuration;
      }
      if (
        expectedGraduationDate &&
        String(student.expectedGraduationDate ?? '') !== expectedGraduationDate.toISOString()
      ) {
        patch.expectedGraduationDate = expectedGraduationDate;
      }
      if (Object.keys(patch).length > 0) {
        await studentRepository.updateById(institutionId, String(student._id), patch);
      }
    }
  }

  private async assertStudentCapacity(institutionId: string, additionalCount = 1) {
    const current = await studentRepository.countForCapacity(institutionId);
    if (current + additionalCount > INSTITUTION_MAX_STUDENTS) {
      throw new ValidationError(
        `This institution can have at most ${INSTITUTION_MAX_STUDENTS} students.`,
      );
    }
  }

  /** Section is scoped to one program + semester (e.g. B.Tech CSE Sem V, not ECE). */
  private async assertSectionMatchesStudent(
    institutionId: string,
    sectionId: string | null | undefined,
    student: { programId?: string | null; semesterId?: string | null },
  ) {
    if (!sectionId) return;
    const section = await SectionModel.findOne({
      _id: sectionId,
      institutionId: new Types.ObjectId(institutionId),
      deletedAt: null,
      status: { $ne: 'archived' },
    })
      .select('programId semesterId name')
      .lean()
      .exec();
    if (!section) {
      throw new ValidationError('Invalid section');
    }
    if (
      student.programId &&
      String(section.programId) !== student.programId
    ) {
      throw new ValidationError(
        `Section "${section.name}" is not for this student's degree program (e.g. CSE vs ECE)`,
      );
    }
    if (
      student.semesterId &&
      String(section.semesterId) !== student.semesterId
    ) {
      throw new ValidationError(
        `Section "${section.name}" is for a different semester — use the section for this student's term (e.g. 3rd year / Sem V)`,
      );
    }
  }

  /** Fill program, department, semester, and academic year from section when omitted. */
  private async enrichOrgFieldsFromSection(
    institutionId: string,
    input: {
      sectionId?: string | null;
      programId?: string | null;
      semesterId?: string | null;
      departmentId?: string | null;
      academicYearId?: string | null;
    },
  ): Promise<{
    programId?: string | null;
    semesterId?: string | null;
    departmentId?: string | null;
    academicYearId?: string | null;
  }> {
    if (!input.sectionId) return {};
    const section = await SectionModel.findOne({
      _id: input.sectionId,
      institutionId: new Types.ObjectId(institutionId),
      deletedAt: null,
    })
      .select('programId semesterId')
      .lean()
      .exec();
    if (!section) return {};

    const out: {
      programId?: string | null;
      semesterId?: string | null;
      departmentId?: string | null;
      academicYearId?: string | null;
    } = {};

    if (!input.programId) out.programId = String(section.programId);
    if (!input.semesterId) out.semesterId = String(section.semesterId);

    const programId = out.programId ?? input.programId;
    if (!input.departmentId && programId) {
      const program = await ProgramModel.findOne({
        _id: programId,
        institutionId: new Types.ObjectId(institutionId),
        deletedAt: null,
      })
        .select('departmentId')
        .lean()
        .exec();
      if (program?.departmentId) out.departmentId = String(program.departmentId);
    }

    const semesterId = out.semesterId ?? input.semesterId;
    if (!input.academicYearId && semesterId) {
      const semester = await SemesterModel.findOne({
        _id: semesterId,
        institutionId: new Types.ObjectId(institutionId),
        deletedAt: null,
      })
        .select('academicYearId')
        .lean()
        .exec();
      if (semester?.academicYearId) out.academicYearId = String(semester.academicYearId);
    }

    return out;
  }

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
    await this.assertStudentCapacity(institutionId);
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

    const fromSection = await this.enrichOrgFieldsFromSection(institutionId, input);
    const createInput = { ...input, ...fromSection };

    await this.assertSectionMatchesStudent(institutionId, createInput.sectionId, {
      programId: createInput.programId ?? null,
      semesterId: createInput.semesterId ?? null,
    });

    const fullName = buildFullName(createInput.firstName, createInput.middleName, createInput.lastName);
    const resolvedDuration = await this.resolveProgramDurationYears(
      institutionId,
      createInput.programId,
      createInput.programDuration,
    );
    const programDuration =
      input.programDuration ?? resolvedDuration ?? DEFAULT_PROGRAM_DURATION_YEARS;
    const expectedGraduationDate =
      input.expectedGraduationDate ??
      this.computeExpectedGraduationForStudent({
        yearOfStudy: createInput.yearOfStudy,
        programDuration,
        admissionDate: createInput.admissionDate,
        force: true,
      });
    const doc = await studentRepository.create({
      ...createInput,
      studentId,
      admissionNumber,
      email: createInput.email.toLowerCase(),
      fullName,
      programDuration,
      expectedGraduationDate: expectedGraduationDate ?? createInput.expectedGraduationDate ?? null,
      campusId: createInput.campusId ? new Types.ObjectId(createInput.campusId) : null,
      schoolId: createInput.schoolId ? new Types.ObjectId(createInput.schoolId) : null,
      departmentId: createInput.departmentId ? new Types.ObjectId(createInput.departmentId) : null,
      programId: createInput.programId ? new Types.ObjectId(createInput.programId) : null,
      academicYearId: createInput.academicYearId ? new Types.ObjectId(createInput.academicYearId) : null,
      semesterId: createInput.semesterId ? new Types.ObjectId(createInput.semesterId) : null,
      sectionId: createInput.sectionId ? new Types.ObjectId(createInput.sectionId) : null,
      batchId: createInput.batchId ? new Types.ObjectId(createInput.batchId) : null,
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

    const sectionIdForEnrich =
      input.sectionId !== undefined
        ? input.sectionId
        : existing.sectionId
          ? String(existing.sectionId)
          : null;
    const fromSection = await this.enrichOrgFieldsFromSection(institutionId, {
      sectionId: sectionIdForEnrich,
      programId:
        input.programId !== undefined
          ? input.programId
          : existing.programId
            ? String(existing.programId)
            : null,
      semesterId:
        input.semesterId !== undefined
          ? input.semesterId
          : existing.semesterId
            ? String(existing.semesterId)
            : null,
      departmentId:
        input.departmentId !== undefined
          ? input.departmentId
          : existing.departmentId
            ? String(existing.departmentId)
            : null,
      academicYearId:
        input.academicYearId !== undefined
          ? input.academicYearId
          : existing.academicYearId
            ? String(existing.academicYearId)
            : null,
    });

    const patch: Record<string, unknown> = {
      ...input,
      ...fromSection,
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
    for (const key of ['departmentId', 'programId', 'academicYearId', 'semesterId'] as const) {
      if (input[key] === undefined && typeof patch[key] === 'string' && patch[key]) {
        patch[key] = new Types.ObjectId(patch[key]);
      }
    }

    const resolvedProgramId =
      patch.programId != null
        ? String(patch.programId)
        : input.programId !== undefined
          ? input.programId
          : existing.programId
            ? String(existing.programId)
            : null;
    const resolvedSemesterId =
      patch.semesterId != null
        ? String(patch.semesterId)
        : input.semesterId !== undefined
          ? input.semesterId
          : existing.semesterId
            ? String(existing.semesterId)
            : null;
    if (input.sectionId !== undefined) {
      await this.assertSectionMatchesStudent(institutionId, input.sectionId, {
        programId: resolvedProgramId,
        semesterId: resolvedSemesterId,
      });
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

    const resolvedDuration = await this.resolveProgramDurationYears(
      institutionId,
      resolvedProgramId,
      input.programDuration !== undefined ? input.programDuration : existing.programDuration,
    );
    const programDuration =
      input.programDuration ??
      resolvedDuration ??
      existing.programDuration ??
      DEFAULT_PROGRAM_DURATION_YEARS;
    if (input.programDuration !== undefined || resolvedDuration != null) {
      patch.programDuration = programDuration;
    }
    const yearOfStudy =
      input.yearOfStudy !== undefined ? input.yearOfStudy : existing.yearOfStudy;
    const admissionDate =
      input.admissionDate !== undefined ? input.admissionDate : existing.admissionDate;
    const shouldRecomputeExpected =
      input.expectedGraduationDate === undefined &&
      (input.yearOfStudy !== undefined ||
        input.programDuration !== undefined ||
        input.programId !== undefined ||
        input.admissionDate !== undefined);
    if (shouldRecomputeExpected || input.expectedGraduationDate !== undefined) {
      patch.expectedGraduationDate =
        input.expectedGraduationDate ??
        this.computeExpectedGraduationForStudent({
          yearOfStudy,
          programDuration,
          admissionDate,
          existingExpected: existing.expectedGraduationDate,
          force: shouldRecomputeExpected,
        });
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

    const patch: Record<string, unknown> = {
      ...input,
      updatedBy: new Types.ObjectId(actor.userId),
    };
    if (input.guardianEmail !== undefined) {
      patch.guardianEmail = input.guardianEmail
        ? input.guardianEmail.toLowerCase()
        : null;
    }
    if (
      input.firstName !== undefined ||
      input.middleName !== undefined ||
      input.lastName !== undefined
    ) {
      patch.fullName = buildFullName(
        input.firstName ?? existing.firstName,
        input.middleName !== undefined ? input.middleName : existing.middleName,
        input.lastName ?? existing.lastName,
      );
    }
    const doc = await studentRepository.updateById(institutionId, String(existing._id), patch);
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
        ? DepartmentModel.find({ _id: { $in: departmentIds } }).select('name code').exec()
        : [],
      programIds.length > 0 ? ProgramModel.find({ _id: { $in: programIds } }).exec() : [],
      batchIds.length > 0 ? BatchModel.find({ _id: { $in: batchIds } }).exec() : [],
      sectionIds.length > 0 ? SectionModel.find({ _id: { $in: sectionIds } }).exec() : [],
    ]);

    const deptName = new Map(departments.map((d) => [String(d._id), d.name]));
    const deptCode = new Map(departments.map((d) => [String(d._id), d.code]));
    const progName = new Map(programs.map((p) => [String(p._id), p.name]));
    const batchName = new Map(batches.map((b) => [String(b._id), b.name]));
    const sectionName = new Map(sections.map((s) => [String(s._id), s.name]));

    const byDepartment = raw.byDepartment
      .filter((d) => {
        if (!d._id) return true;
        const code = deptCode.get(String(d._id));
        return !isExcludedSoeDepartmentCode(code);
      })
      .map((d) => ({
        departmentId: d._id ? String(d._id) : null,
        label: d._id ? (deptName.get(String(d._id)) ?? 'Unknown') : 'Unassigned',
        count: d.count as number,
      }));

    const byProgram = raw.byProgram.map((d) => ({
      programId: d._id ? String(d._id) : null,
      label: d._id ? (progName.get(String(d._id)) ?? 'Unknown') : 'Unassigned',
      count: d.count as number,
    }));

    return {
      total: raw.total,
      active: raw.active,
      inactive: raw.inactive,
      suspended: raw.suspended,
      graduated: raw.graduated,
      dropped: raw.dropped,
      transferred: raw.transferred,
      archived: raw.archived,
      departments: byDepartment.filter((d) => d.departmentId).length,
      programs: byProgram.filter((d) => d.programId).length,
      batches: raw.byBatch.filter((d) => d._id).length,
      sections: raw.bySection.filter((d) => d._id).length,
      scholarshipCount: raw.scholarshipCount,
      newThisMonth: raw.newThisMonth,
      byDepartment,
      byProgram,
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
    const students = await studentRepository.findByIds(institutionId, input.ids);
    if (students.length !== input.ids.length) {
      throw new NotFoundError('One or more students not found');
    }
    for (const student of students) {
      await this.assertSectionMatchesStudent(institutionId, input.sectionId, {
        programId: student.programId ? String(student.programId) : null,
        semesterId: student.semesterId ? String(student.semesterId) : null,
      });
    }
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
    const semester = await SemesterModel.findOne({
      _id: new Types.ObjectId(input.semesterId),
      institutionId: new Types.ObjectId(institutionId),
      deletedAt: null,
    })
      .select('number academicYearId')
      .lean()
      .exec();
    if (!semester) throw new NotFoundError('Semester not found');

    const derivedCurrentSemester =
      input.currentSemester ?? (semester.number > 0 ? semester.number : null);
    const derivedYearOfStudy =
      input.yearOfStudy ??
      (semester.number > 0 ? Math.min(10, Math.max(1, Math.ceil(semester.number / 2))) : null);
    const academicYearId =
      input.academicYearId !== undefined && input.academicYearId !== null
        ? input.academicYearId
        : String(semester.academicYearId);

    const modified = await studentRepository.bulkAssignSemester(institutionId, input.ids, {
      semesterId: input.semesterId,
      academicYearId,
      currentSemester: derivedCurrentSemester,
      yearOfStudy: derivedYearOfStudy,
    });
    await this.syncExpectedGraduationForStudents(institutionId, input.ids);
    await this.audit('student.updated', actor, institutionId, null, {
      bulk: true,
      action: 'assign_semester',
      semesterId: input.semesterId,
      academicYearId,
      yearOfStudy: derivedYearOfStudy,
      currentSemester: derivedCurrentSemester,
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

  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private isObjectId(value: string | undefined | null): boolean {
    const trimmed = value?.trim();
    return Boolean(trimmed && REGEX.OBJECT_ID.test(trimmed));
  }

  private importOptionalObjectId(value: string | undefined): string | null {
    const trimmed = value?.trim();
    if (!trimmed) return null;
    return REGEX.OBJECT_ID.test(trimmed) ? trimmed : null;
  }

  private importRowToCreatePayload(row: Record<string, string>) {
    return {
      studentId: row.studentId?.trim() || undefined,
      admissionNumber: row.admissionNumber?.trim() || undefined,
      rollNumber: row.rollNumber || null,
      registrationNumber: row.registrationNumber || null,
      firstName: row.firstName,
      middleName: row.middleName || null,
      lastName: row.lastName,
      email: row.email,
      phone: row.phone || null,
      campusId: this.importOptionalObjectId(row.campusId),
      schoolId: this.importOptionalObjectId(row.schoolId),
      departmentId: this.importOptionalObjectId(row.departmentId),
      programId: this.importOptionalObjectId(row.programId),
      academicYearId: this.importOptionalObjectId(row.academicYearId),
      semesterId: this.importOptionalObjectId(row.semesterId),
      sectionId: this.importOptionalObjectId(row.sectionId),
      batchId: this.importOptionalObjectId(row.batchId),
      yearOfStudy: row.yearOfStudy ? Number(row.yearOfStudy) : null,
      currentSemester: row.currentSemester ? Number(row.currentSemester) : null,
      admissionDate: row.admissionDate || null,
      status: row.status || 'active',
      scholarship: row.scholarship === 'true' || row.scholarship === '1',
      hostelResident: row.hostelResident === 'true' || row.hostelResident === '1',
      transportRequired: row.transportRequired === 'true' || row.transportRequired === '1',
      guardianName: row.guardianName || null,
      guardianPhone: row.guardianPhone || null,
    };
  }

  private importResolutionErrors(
    raw: Record<string, string>,
    resolved: Record<string, string>,
  ): string | null {
    if (raw.sectionName?.trim() && !this.isObjectId(resolved.sectionId)) {
      return `Unknown section: ${raw.sectionName.trim()}`;
    }
    if (raw.programCode?.trim() && !this.isObjectId(resolved.programId)) {
      return `Unknown program code: ${raw.programCode.trim()}`;
    }
    if (raw.semesterName?.trim() && !this.isObjectId(resolved.semesterId)) {
      return `Unknown semester: ${raw.semesterName.trim()}`;
    }
    if (raw.academicYearName?.trim() && !this.isObjectId(resolved.academicYearId)) {
      return `Unknown academic year: ${raw.academicYearName.trim()}`;
    }
    if (raw.batchName?.trim() && !this.isObjectId(resolved.batchId)) {
      return `Unknown batch: ${raw.batchName.trim()}`;
    }
    return null;
  }

  private async resolveImportRowAcademics(
    institutionId: string,
    row: Record<string, string>,
  ): Promise<Record<string, string>> {
    const out = { ...row };
    const instOid = new Types.ObjectId(institutionId);

    out.sectionId = this.importOptionalObjectId(out.sectionId) ?? '';
    out.programId = this.importOptionalObjectId(out.programId) ?? '';
    out.semesterId = this.importOptionalObjectId(out.semesterId) ?? '';
    out.academicYearId = this.importOptionalObjectId(out.academicYearId) ?? '';
    out.batchId = this.importOptionalObjectId(out.batchId) ?? '';

    type SectionLean = {
      _id: Types.ObjectId;
      programId: Types.ObjectId;
      semesterId: Types.ObjectId;
    };

    let section: SectionLean | null = null;
    if (this.isObjectId(out.sectionId)) {
      section = await SectionModel.findOne({
        _id: out.sectionId,
        institutionId: instOid,
        deletedAt: null,
      })
        .select('_id programId semesterId')
        .lean<SectionLean>()
        .exec();
    }
    if (!section && out.sectionName?.trim()) {
      const name = out.sectionName.trim();
      section = await SectionModel.findOne({
        institutionId: instOid,
        deletedAt: null,
        name: { $regex: new RegExp(`^${this.escapeRegex(name)}$`, 'i') },
      })
        .select('_id programId semesterId')
        .lean<SectionLean>()
        .exec();
    }
    if (section) {
      out.sectionId = String(section._id);
      if (!out.programId) out.programId = String(section.programId);
      if (!out.semesterId) out.semesterId = String(section.semesterId);
    }

    if (!this.isObjectId(out.programId) && out.programCode?.trim()) {
      const program = await ProgramModel.findOne({
        institutionId: instOid,
        deletedAt: null,
        code: out.programCode.trim().toUpperCase(),
      })
        .select('_id')
        .lean()
        .exec();
      if (program) out.programId = String(program._id);
    }

    if (!this.isObjectId(out.semesterId) && out.semesterName?.trim()) {
      const semester = await SemesterModel.findOne({
        institutionId: instOid,
        deletedAt: null,
        name: { $regex: new RegExp(`^${this.escapeRegex(out.semesterName.trim())}$`, 'i') },
      })
        .select('_id number academicYearId')
        .lean()
        .exec();
      if (semester) out.semesterId = String(semester._id);
    }

    if (!this.isObjectId(out.academicYearId) && out.academicYearName?.trim()) {
      const year = await AcademicYearModel.findOne({
        institutionId: instOid,
        deletedAt: null,
        name: { $regex: new RegExp(`^${this.escapeRegex(out.academicYearName.trim())}$`, 'i') },
      })
        .select('_id')
        .lean()
        .exec();
      if (year) out.academicYearId = String(year._id);
    }

    if (!this.isObjectId(out.batchId) && out.batchName?.trim()) {
      const batchFilter: Record<string, unknown> = {
        institutionId: instOid,
        deletedAt: null,
        name: { $regex: new RegExp(`^${this.escapeRegex(out.batchName.trim())}$`, 'i') },
      };
      if (this.isObjectId(out.programId)) {
        batchFilter.programId = new Types.ObjectId(out.programId);
      }
      const batch = await BatchModel.findOne(batchFilter).select('_id').lean().exec();
      if (batch) out.batchId = String(batch._id);
    }

    if (this.isObjectId(out.semesterId)) {
      const semester = await SemesterModel.findOne({
        _id: out.semesterId,
        institutionId: instOid,
        deletedAt: null,
      })
        .select('number academicYearId')
        .lean()
        .exec();
      if (semester) {
        if (!this.isObjectId(out.academicYearId)) {
          out.academicYearId = String(semester.academicYearId);
        }
        if (!out.yearOfStudy?.trim()) {
          out.yearOfStudy = String(
            Math.min(10, Math.max(1, Math.ceil(semester.number / 2))),
          );
        }
        if (!out.currentSemester?.trim()) {
          out.currentSemester = String(semester.number);
        }
      }
    }

    return out;
  }

  private parseImportRow(row: Record<string, string>) {
    return createStudentSchema.parse(this.importRowToCreatePayload(row));
  }

  async previewImport(
    rows: Array<Record<string, string>>,
    institutionId: string,
    mode: 'create_only' | 'upsert' = 'create_only',
  ) {
    const errors: Array<{ row: number; field?: string; message: string }> = [];
    let validRows = 0;
    let duplicates = 0;
    let updateRows = 0;
    let createRows = 0;
    const seen = new Set<string>();
    const sample: Array<Record<string, string>> = [];

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index]!;
      const resolved = await this.resolveImportRowAcademics(institutionId, row);
      const resolutionError = this.importResolutionErrors(row, resolved);
      if (resolutionError) {
        errors.push({ row: index + 1, message: resolutionError });
        continue;
      }
      const parsed = createStudentSchema.safeParse(this.importRowToCreatePayload(resolved));

      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          errors.push({
            row: index + 1,
            field: issue.path.join('.'),
            message: issue.message,
          });
        }
        continue;
      }

      const emailKey = parsed.data.email.toLowerCase();
      if (seen.has(emailKey)) {
        duplicates += 1;
        errors.push({ row: index + 1, message: 'Duplicate email in import file' });
        continue;
      }
      seen.add(emailKey);

      const existing = await studentRepository.findByEmail(institutionId, parsed.data.email);
      if (existing && mode === 'upsert') {
        updateRows += 1;
        validRows += 1;
      } else if (existing) {
        errors.push({ row: index + 1, message: 'Student with this email already exists' });
        continue;
      } else {
        createRows += 1;
        validRows += 1;
      }
      if (sample.length < 5) sample.push(row);
    }

    return {
      totalRows: rows.length,
      validRows,
      invalidRows: rows.length - validRows,
      duplicates,
      updateRows,
      createRows,
      errors,
      sample,
    };
  }

  private async ensureStudentLoginEmail(
    input: { email: string; firstName: string; lastName: string },
    institutionId: string,
    studentId: string,
  ): Promise<boolean> {
    const { provisionLoginUser } = await import('../users/provision-login-user.js');
    const provisioned = await provisionLoginUser({
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      institutionId,
      role: 'student',
    });
    if (provisioned.created && provisioned.temporaryPassword) {
      const { sendCredentialsEmail } = await import('../../mail/credentials-email.js');
      void sendCredentialsEmail({
        to: input.email.toLowerCase(),
        firstName: input.firstName,
        role: 'student',
        temporaryPassword: provisioned.temporaryPassword,
        displayIdLabel: 'Student ID',
        displayId: studentId,
      });
      return true;
    }
    return false;
  }

  async importStudents(input: StudentImportConfirmInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const mode = input.mode ?? 'create_only';
    await syncSemesterCalendar(institutionId);
    await this.audit('student.import.started', actor, institutionId, null, {
      rows: input.rows.length,
      dryRun: input.dryRun,
      mode,
    });

    const preview = await this.previewImport(input.rows, institutionId, mode);
    if (input.dryRun) {
      return {
        ...preview,
        imported: 0,
        updated: 0,
        failed: preview.invalidRows,
        studentIds: [],
      };
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

    const newRowCount = preview.createRows ?? input.rows.length;
    await this.assertStudentCapacity(institutionId, newRowCount);

    const newCreatedIds: string[] = [];
    const touchedIds: string[] = [];
    let updated = 0;
    let emailed = 0;

    try {
      for (let i = 0; i < input.rows.length; i += 1) {
        const row = input.rows[i]!;
        const resolved = await this.resolveImportRowAcademics(institutionId, row);
        const resolutionError = this.importResolutionErrors(row, resolved);
        if (resolutionError) {
          throw new ValidationError(resolutionError);
        }
        const parsed = this.parseImportRow(resolved);

        const byEmail = await studentRepository.findByEmail(institutionId, parsed.email);
        if (byEmail && mode === 'upsert') {
          const id = String(byEmail._id);
          await this.update(
            id,
            {
              firstName: parsed.firstName,
              middleName: parsed.middleName,
              lastName: parsed.lastName,
              phone: parsed.phone,
              rollNumber: parsed.rollNumber,
              registrationNumber: parsed.registrationNumber,
              campusId: parsed.campusId,
              schoolId: parsed.schoolId,
              departmentId: parsed.departmentId,
              programId: parsed.programId,
              academicYearId: parsed.academicYearId,
              semesterId: parsed.semesterId,
              sectionId: parsed.sectionId,
              batchId: parsed.batchId,
              yearOfStudy: parsed.yearOfStudy,
              currentSemester: parsed.currentSemester,
              admissionDate: parsed.admissionDate,
              status: parsed.status,
              scholarship: parsed.scholarship,
              hostelResident: parsed.hostelResident,
              transportRequired: parsed.transportRequired,
              guardianName: parsed.guardianName,
              guardianPhone: parsed.guardianPhone,
            },
            actor,
          );
          updated += 1;
          touchedIds.push(id);
          const studentId = byEmail.studentId ?? parsed.studentId ?? '';
          if (await this.ensureStudentLoginEmail(parsed, institutionId, studentId)) {
            emailed += 1;
          }
          continue;
        }

        const existing = await studentRepository.findDuplicates(institutionId, {
          studentId: parsed.studentId ?? '',
          admissionNumber: parsed.admissionNumber ?? '',
          email: parsed.email,
        });
        if (existing.length > 0) {
          throw new ConflictError(`Duplicate student at row ${i + 1}`);
        }

        const created = await this.create(parsed, actor);
        newCreatedIds.push(created.id);
        touchedIds.push(created.id);
        if (created.credentials) {
          emailed += 1;
        }
      }
    } catch (err) {
      for (const id of newCreatedIds) {
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

    const imported = newCreatedIds.length;
    await this.audit('student.import.completed', actor, institutionId, null, {
      imported,
      updated,
      credentialsEmailed: emailed,
      mode,
    });
    await this.audit('student.imported', actor, institutionId, null, {
      imported,
      updated,
    });
    await eventBus.publish(
      EVENTS.STUDENT_IMPORTED,
      { institutionId, count: imported + updated },
      { actorId: actor.userId },
    );

    return {
      imported,
      updated,
      failed: 0,
      errors: [] as Array<{ row: number; message: string }>,
      studentIds: touchedIds,
      credentialsEmailed: emailed,
      totalRows: preview.totalRows,
      validRows: preview.validRows,
      invalidRows: preview.invalidRows,
      duplicates: preview.duplicates,
      updateRows: preview.updateRows,
      createRows: preview.createRows,
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
