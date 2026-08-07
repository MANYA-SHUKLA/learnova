import { Types } from 'mongoose';
import { EVENTS } from '@learnova/events';
import type {
  CreateCourseInput,
  CourseBulkAssignFacultyInput,
  CourseBulkAssignProgramInput,
  CourseBulkAssignSemesterInput,
  CourseBulkIdsInput,
  CourseBulkStatusInput,
  CourseExportQuery,
  CourseImportConfirmInput,
  CourseListQuery,
  CourseThumbnailUploadInput,
  UpdateCourseInput,
} from '@learnova/validation';
import { createCourseSchema } from '@learnova/validation';
import { eventBus } from '../../events/index.js';
import { DepartmentModel } from '../../models/department.model.js';
import { FacultyModel } from '../../models/faculty.model.js';
import { getStorage } from '../../storage/index.js';
import { logger } from '../../utils/logger/index.js';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../utils/errors/index.js';
import { courseRepository } from '../../repositories/course/course.repository.js';

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
  'courseCode',
  'slug',
  'title',
  'subtitle',
  'description',
  'shortDescription',
  'category',
  'difficulty',
  'language',
  'credits',
  'estimatedHours',
  'duration',
  'status',
  'visibility',
  'departmentId',
  'campusId',
  'schoolId',
  'coordinatorId',
  'tags',
  'skills',
  'learningObjectives',
  'certificateEnabled',
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

async function scopeByFacultyAccess(
  filter: Record<string, unknown>,
  actor: ActorContext,
  institutionId: string,
): Promise<Record<string, unknown>> {
  if (actor.role !== 'faculty') return filter;

  const facultyRecord = await FacultyModel.findOne({
    institutionId: new Types.ObjectId(institutionId),
    email: actor.email.toLowerCase(),
    deletedAt: null,
  }).exec();

  if (!facultyRecord) {
    filter._id = null;
    return filter;
  }

  const $or: Record<string, unknown>[] = [];
  $or.push({ facultyIds: facultyRecord._id });
  if (facultyRecord.departmentId) {
    $or.push({ departmentId: facultyRecord.departmentId });
  }
  $or.push({ coordinatorId: facultyRecord._id });

  filter.$or = $or;
  return filter;
}

export class CourseService {
  private async audit(
    event: Parameters<typeof courseRepository.logAudit>[0]['event'],
    actor: ActorContext,
    institutionId: string,
    courseId?: string | null,
    metadata?: Record<string, unknown>,
  ) {
    await courseRepository.logAudit({
      event,
      institutionId,
      courseId,
      userId: actor.userId,
      email: actor.email,
      metadata,
    });
  }

  async create(input: CreateCourseInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const duplicates = await courseRepository.findDuplicates(institutionId, {
      courseCode: input.courseCode,
      slug: input.slug,
    });
    if (duplicates.length > 0) {
      throw new ConflictError('Course with same course code or slug already exists');
    }

    const doc = await courseRepository.create({
      ...input,
      courseCode: input.courseCode.toUpperCase(),
      slug: input.slug.toLowerCase(),
      programIds: (input.programIds ?? []).map((id) => new Types.ObjectId(id)),
      semesterIds: (input.semesterIds ?? []).map((id) => new Types.ObjectId(id)),
      facultyIds: (input.facultyIds ?? []).map((id) => new Types.ObjectId(id)),
      campusId: input.campusId ? new Types.ObjectId(input.campusId) : null,
      schoolId: input.schoolId ? new Types.ObjectId(input.schoolId) : null,
      departmentId: input.departmentId ? new Types.ObjectId(input.departmentId) : null,
      coordinatorId: input.coordinatorId ? new Types.ObjectId(input.coordinatorId) : null,
      institutionId: new Types.ObjectId(institutionId),
      createdBy: new Types.ObjectId(actor.userId),
      updatedBy: new Types.ObjectId(actor.userId),
      deletedAt: null,
    });

    await this.audit('course.created', actor, institutionId, String(doc._id));
    await eventBus.publish(
      EVENTS.COURSE_CREATED,
      {
        courseId: String(doc._id),
        institutionId,
      },
      { actorId: actor.userId },
    );

    return toDto(doc);
  }

  async list(query: CourseListQuery, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    let filter = courseRepository.buildFilter(institutionId, query);
    filter = await scopeByFacultyAccess(filter, actor, institutionId);

    const result = await courseRepository.list(institutionId, {
      ...query,
    });

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
    const doc = await courseRepository.findByIdIncludingDeleted(institutionId, id);
    if (!doc) throw new NotFoundError('Course not found');

    if (actor.role === 'faculty') {
      const facultyRecord = await FacultyModel.findOne({
        institutionId: new Types.ObjectId(institutionId),
        email: actor.email.toLowerCase(),
        deletedAt: null,
      }).exec();

      if (!facultyRecord) {
        throw new ForbiddenError('Not allowed to access this course');
      }

      const isFacultyAssigned = doc.facultyIds.some(
        (fid) => String(fid) === String(facultyRecord._id),
      );
      const isCoordinator = doc.coordinatorId
        ? String(doc.coordinatorId) === String(facultyRecord._id)
        : false;
      const isDepartmentMatch =
        facultyRecord.departmentId && doc.departmentId
          ? String(facultyRecord.departmentId) === String(doc.departmentId)
          : false;

      if (!isFacultyAssigned && !isCoordinator && !isDepartmentMatch) {
        throw new ForbiddenError('Not allowed to access this course');
      }
    }

    return toDto(doc);
  }

  async update(id: string, input: UpdateCourseInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const existing = await courseRepository.findById(institutionId, id);
    if (!existing) throw new NotFoundError('Course not found');

    if (input.courseCode || input.slug) {
      const duplicates = await courseRepository.findDuplicates(institutionId, {
        courseCode: input.courseCode,
        slug: input.slug,
      });
      const conflict = duplicates.find((d) => String(d._id) !== id);
      if (conflict) {
        throw new ConflictError('Course with same course code or slug already exists');
      }
    }

    const patch: Record<string, unknown> = { ...input, updatedBy: new Types.ObjectId(actor.userId) };
    if (input.courseCode) patch.courseCode = input.courseCode.toUpperCase();
    if (input.slug) patch.slug = input.slug.toLowerCase();
    if (input.programIds) {
      patch.programIds = input.programIds.map((pid) => new Types.ObjectId(pid));
    }
    if (input.semesterIds) {
      patch.semesterIds = input.semesterIds.map((sid) => new Types.ObjectId(sid));
    }
    if (input.facultyIds) {
      patch.facultyIds = input.facultyIds.map((fid) => new Types.ObjectId(fid));
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
    if (input.coordinatorId !== undefined) {
      patch.coordinatorId = input.coordinatorId ? new Types.ObjectId(input.coordinatorId) : null;
    }

    const doc = await courseRepository.updateById(institutionId, id, patch);
    if (!doc) throw new NotFoundError('Course not found');

    const statusChanged = input.status && input.status !== existing.status;
    await this.audit(
      statusChanged ? 'course.updated' : 'course.updated',
      actor,
      institutionId,
      id,
      statusChanged ? { status: input.status } : { fields: Object.keys(input) },
    );

    await eventBus.publish(
      EVENTS.COURSE_UPDATED,
      { courseId: id, institutionId },
      { actorId: actor.userId },
    );

    return toDto(doc);
  }

  async archive(id: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const doc = await courseRepository.softDelete(institutionId, id);
    if (!doc) throw new NotFoundError('Course not found');
    await this.audit('course.archived', actor, institutionId, id);
    await eventBus.publish(
      EVENTS.COURSE_ARCHIVED,
      { courseId: id, institutionId },
      { actorId: actor.userId },
    );
    return toDto(doc);
  }

  async restore(id: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const doc = await courseRepository.restore(institutionId, id);
    if (!doc) throw new NotFoundError('Course not found');
    await this.audit('course.restored', actor, institutionId, id);
    return toDto(doc);
  }

  async publish(id: string, actor: ActorContext) {
    return this.update(id, { status: 'published', publishDate: new Date() }, actor);
  }

  async unpublish(id: string, actor: ActorContext) {
    return this.update(id, { status: 'draft' }, actor);
  }

  async archiveStatus(id: string, actor: ActorContext) {
    return this.update(id, { status: 'archived', archiveDate: new Date() }, actor);
  }

  async duplicate(id: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const existing = await courseRepository.findById(institutionId, id);
    if (!existing) throw new NotFoundError('Course not found');

    const newCourseCode = `${existing.courseCode}-COPY`;
    const newSlug = `${existing.slug}-copy-${Date.now()}`;

    const doc = await courseRepository.create({
      courseCode: newCourseCode,
      slug: newSlug,
      title: `${existing.title} (Copy)`,
      subtitle: existing.subtitle,
      description: existing.description,
      shortDescription: existing.shortDescription,
      thumbnail: existing.thumbnail,
      banner: existing.banner,
      icon: existing.icon,
      institutionId: existing.institutionId,
      campusId: existing.campusId,
      schoolId: existing.schoolId,
      departmentId: existing.departmentId,
      programIds: existing.programIds,
      semesterIds: existing.semesterIds,
      facultyIds: existing.facultyIds,
      coordinatorId: existing.coordinatorId,
      category: existing.category,
      difficulty: existing.difficulty,
      language: existing.language,
      credits: existing.credits,
      estimatedHours: existing.estimatedHours,
      duration: existing.duration,
      status: 'draft',
      visibility: existing.visibility,
      version: 1,
      tags: existing.tags,
      learningObjectives: existing.learningObjectives,
      prerequisites: existing.prerequisites,
      requirements: existing.requirements,
      outcomes: existing.outcomes,
      skills: existing.skills,
      certificateEnabled: existing.certificateEnabled,
      discussionEnabled: existing.discussionEnabled,
      allowDownloads: existing.allowDownloads,
      allowPreview: existing.allowPreview,
      maxStudents: existing.maxStudents,
      enrollmentMode: existing.enrollmentMode,
      publishDate: null,
      archiveDate: null,
      seoTitle: existing.seoTitle,
      seoDescription: existing.seoDescription,
      seoKeywords: existing.seoKeywords,
      createdBy: new Types.ObjectId(actor.userId),
      updatedBy: new Types.ObjectId(actor.userId),
      deletedAt: null,
    });

    await this.audit('course.duplicated', actor, institutionId, String(doc._id), {
      originalId: id,
    });

    return toDto(doc);
  }

  async getStats(actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const raw = await courseRepository.getStats(institutionId);

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
      published: raw.published,
      draft: raw.draft,
      review: raw.review,
      archived: raw.archived,
      scheduled: raw.scheduled,
      facultyAssigned: raw.facultyAssigned,
      programs: raw.programs,
      departments: raw.departments,
      averageDurationHours: raw.averageDurationHours,
      totalCredits: raw.totalCredits,
      byDepartment: raw.byDepartment.map((d) => ({
        departmentId: d._id ? String(d._id) : null,
        label: d._id ? (deptName.get(String(d._id)) ?? 'Unknown') : 'Unassigned',
        count: d.count as number,
      })),
      byCategory: raw.byCategory.map((d) => ({
        category: d._id as string,
        count: d.count as number,
      })),
      byDifficulty: raw.byDifficulty.map((d) => ({
        difficulty: d._id as string,
        count: d.count as number,
      })),
      recent: raw.recent.map((doc) => ({
        id: String(doc._id),
        title: doc.title,
        courseCode: doc.courseCode,
        status: doc.status,
        updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : String(doc.updatedAt),
      })),
    };
  }

  async listAudit(courseId: string | undefined, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const items = await courseRepository.listAudit(institutionId, courseId, 100);
    return items.map((item) => ({
      id: String(item._id),
      event: item.event,
      courseId: item.courseId ? String(item.courseId) : null,
      userId: item.userId ? String(item.userId) : null,
      email: item.email,
      metadata: item.metadata,
      createdAt:
        item.createdAt instanceof Date ? item.createdAt.toISOString() : String(item.createdAt),
    }));
  }

  async bulkPublish(input: CourseBulkIdsInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const modified = await courseRepository.bulkUpdateStatus(
      institutionId,
      input.ids,
      'published',
    );
    await this.audit('course.published', actor, institutionId, null, {
      bulk: true,
      ids: input.ids,
      modified,
    });
    for (const id of input.ids) {
      await eventBus.publish(
        EVENTS.COURSE_PUBLISHED,
        { courseId: id, institutionId },
        { actorId: actor.userId },
      );
    }
    return { modified };
  }

  async bulkArchive(input: CourseBulkIdsInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const modified = await courseRepository.bulkArchive(institutionId, input.ids);
    await this.audit('course.archived', actor, institutionId, null, {
      bulk: true,
      ids: input.ids,
      modified,
    });
    return { modified };
  }

  async bulkDelete(input: CourseBulkIdsInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const modified = await courseRepository.bulkArchive(institutionId, input.ids);
    await this.audit('course.deleted', actor, institutionId, null, {
      bulk: true,
      ids: input.ids,
      modified,
    });
    for (const id of input.ids) {
      await eventBus.publish(
        EVENTS.COURSE_DELETED,
        { courseId: id, institutionId },
        { actorId: actor.userId },
      );
    }
    return { modified };
  }

  async bulkStatus(input: CourseBulkStatusInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const modified = await courseRepository.bulkUpdateStatus(
      institutionId,
      input.ids,
      input.status,
    );
    await this.audit('course.updated', actor, institutionId, null, {
      bulk: true,
      status: input.status,
      ids: input.ids,
      modified,
    });
    return { modified };
  }

  async bulkAssignFaculty(input: CourseBulkAssignFacultyInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const modified = await courseRepository.bulkAssignFaculty(
      institutionId,
      input.ids,
      input.facultyIds,
      input.mode ?? 'append',
      input.coordinatorId,
    );
    await this.audit('course.assigned.faculty', actor, institutionId, null, {
      bulk: true,
      facultyIds: input.facultyIds,
      coordinatorId: input.coordinatorId,
      modified,
    });
    return { modified };
  }

  async bulkAssignProgram(input: CourseBulkAssignProgramInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const modified = await courseRepository.bulkAssignPrograms(
      institutionId,
      input.ids,
      input.programIds,
      input.mode ?? 'append',
    );
    await this.audit('course.updated', actor, institutionId, null, {
      bulk: true,
      action: 'assign_program',
      programIds: input.programIds,
      modified,
    });
    return { modified };
  }

  async bulkAssignSemester(input: CourseBulkAssignSemesterInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const modified = await courseRepository.bulkAssignSemesters(
      institutionId,
      input.ids,
      input.semesterIds,
      input.mode ?? 'append',
    );
    await this.audit('course.updated', actor, institutionId, null, {
      bulk: true,
      action: 'assign_semester',
      semesterIds: input.semesterIds,
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
      const parsed = createCourseSchema.safeParse({
        courseCode: row.courseCode,
        slug: row.slug,
        title: row.title,
        subtitle: row.subtitle || null,
        description: row.description || null,
        shortDescription: row.shortDescription || null,
        category: row.category || 'general',
        difficulty: row.difficulty || 'beginner',
        language: row.language || 'en',
        credits: row.credits ? Number(row.credits) : 0,
        estimatedHours: row.estimatedHours ? Number(row.estimatedHours) : null,
        duration: row.duration || null,
        status: row.status || 'draft',
        visibility: row.visibility || 'institution',
        campusId: row.campusId || null,
        schoolId: row.schoolId || null,
        departmentId: row.departmentId || null,
        coordinatorId: row.coordinatorId || null,
        tags: row.tags ? row.tags.split('|').filter(Boolean) : [],
        skills: row.skills ? row.skills.split('|').filter(Boolean) : [],
        learningObjectives: row.learningObjectives
          ? row.learningObjectives.split('|').filter(Boolean)
          : [],
        certificateEnabled: row.certificateEnabled === 'true' || row.certificateEnabled === '1',
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

      const key = `${parsed.data.courseCode}|${parsed.data.slug}`;
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

  async importCourses(input: CourseImportConfirmInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    await this.audit('course.import.started', actor, institutionId, null, {
      rows: input.rows.length,
      dryRun: input.dryRun,
    });

    const preview = this.previewImport(input.rows);
    if (input.dryRun) {
      return { ...preview, imported: 0, failed: preview.invalidRows, courseIds: [] };
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
        const parsed = createCourseSchema.parse({
          courseCode: row.courseCode,
          slug: row.slug,
          title: row.title,
          subtitle: row.subtitle || null,
          description: row.description || null,
          shortDescription: row.shortDescription || null,
          category: row.category || 'general',
          difficulty: row.difficulty || 'beginner',
          language: row.language || 'en',
          credits: row.credits ? Number(row.credits) : 0,
          estimatedHours: row.estimatedHours ? Number(row.estimatedHours) : null,
          duration: row.duration || null,
          status: row.status || 'draft',
          visibility: row.visibility || 'institution',
          campusId: row.campusId || null,
          schoolId: row.schoolId || null,
          departmentId: row.departmentId || null,
          coordinatorId: row.coordinatorId || null,
          tags: row.tags ? row.tags.split('|').filter(Boolean) : [],
          skills: row.skills ? row.skills.split('|').filter(Boolean) : [],
          learningObjectives: row.learningObjectives
            ? row.learningObjectives.split('|').filter(Boolean)
            : [],
          certificateEnabled: row.certificateEnabled === 'true' || row.certificateEnabled === '1',
        });

        const existing = await courseRepository.findDuplicates(institutionId, {
          courseCode: parsed.courseCode,
          slug: parsed.slug,
        });
        if (existing.length > 0) {
          throw new ConflictError(`Duplicate course at row ${i + 1}`);
        }

        const created = await this.create(parsed, actor);
        createdIds.push(String(created.id));
      }
    } catch (err) {
      for (const id of createdIds) {
        await courseRepository.hardDelete(institutionId, id);
      }
      logger.error({ err, institutionId }, 'Course import rolled back');
      throw err;
    }

    await this.audit('course.import.completed', actor, institutionId, null, {
      imported: createdIds.length,
    });
    await this.audit('course.imported', actor, institutionId, null, {
      imported: createdIds.length,
    });

    return {
      imported: createdIds.length,
      failed: 0,
      errors: [] as Array<{ row: number; message: string }>,
      courseIds: createdIds,
      totalRows: preview.totalRows,
      validRows: preview.validRows,
      invalidRows: preview.invalidRows,
      duplicates: preview.duplicates,
      sample: preview.sample,
    };
  }

  async exportCourses(query: CourseExportQuery, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const list = await courseRepository.list(institutionId, {
      q: query.q,
      status: query.status,
      visibility: query.visibility,
      difficulty: query.difficulty,
      category: query.category,
      departmentId: query.departmentId,
      programId: query.programId,
      facultyId: query.facultyId,
      includeDeleted: query.includeDeleted,
      page: 1,
      limit: 5000,
    });

    const rows: Array<Record<string, unknown>> = list.items.map((doc) => {
      const dto = toDto(doc);
      return {
        ...dto,
        tags: Array.isArray(dto.tags) ? (dto.tags as string[]).join('|') : '',
        skills: Array.isArray(dto.skills) ? (dto.skills as string[]).join('|') : '',
        learningObjectives: Array.isArray(dto.learningObjectives)
          ? (dto.learningObjectives as string[]).join('|')
          : '',
      };
    });

    await this.audit('course.export', actor, institutionId, null, {
      format: query.format,
      count: rows.length,
    });
    await this.audit('course.exported', actor, institutionId, null, {
      format: query.format,
      count: rows.length,
    });

    const csv = rowsToCsv(rows);
    if (query.format === 'pdf') {
      const lines = rows.map(
        (r) =>
          `${String(r.title ?? '')} | ${String(r.courseCode ?? '')} | ${String(r.status ?? '')} | ${String(r.credits ?? '')} credits`,
      );
      const body = `Learnova Course Export\n\n${lines.join('\n')}\n`;
      return {
        contentType: 'application/pdf',
        filename: 'course-export.pdf',
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
      filename: query.format === 'excel' ? 'course-export.xls' : 'course-export.csv',
      body: Buffer.from(csv, 'utf8'),
    };
  }

  async uploadThumbnail(id: string, input: CourseThumbnailUploadInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const existing = await courseRepository.findById(institutionId, id);
    if (!existing) throw new NotFoundError('Course not found');

    const ext =
      input.contentType === 'image/png'
        ? 'png'
        : input.contentType === 'image/webp'
          ? 'webp'
          : 'jpg';
    const key = `courses/${institutionId}/${id}/thumbnail.${ext}`;
    const storage = getStorage();
    const stored = await storage.put({
      key,
      body: Buffer.from(input.data, 'base64'),
      contentType: input.contentType,
    });

    const thumbnail = stored.url ?? key;
    const doc = await courseRepository.updateById(institutionId, id, {
      thumbnail,
      updatedBy: new Types.ObjectId(actor.userId),
    });
    if (!doc) throw new NotFoundError('Course not found');

    await this.audit('course.updated', actor, institutionId, id, { thumbnail: true });
    return toDto(doc);
  }

  async removeThumbnail(id: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const existing = await courseRepository.findById(institutionId, id);
    if (!existing) throw new NotFoundError('Course not found');

    const doc = await courseRepository.updateById(institutionId, id, {
      thumbnail: null,
      updatedBy: new Types.ObjectId(actor.userId),
    });
    if (!doc) throw new NotFoundError('Course not found');
    await this.audit('course.updated', actor, institutionId, id, { thumbnailRemoved: true });
    return toDto(doc);
  }
}

export const courseService = new CourseService();
