import { Types } from 'mongoose';
import { EVENTS } from '@learnova/events';
import slugify from 'slugify';
import type {
  CreateCourseModuleInput,
  UpdateCourseModuleInput,
  CreateCourseLessonInput,
  UpdateCourseLessonInput,
  CreateCourseResourceInput,
  UpdateCourseResourceInput,
  BuilderReorderInput,
  BuilderSearchQuery,
  MoveLessonInput,
} from '@learnova/validation';
import { eventBus } from '../../events/index.js';
import { CourseModel } from '../../models/course.model.js';
import { getStorage } from '../../storage/index.js';
import { logger } from '../../utils/logger/index.js';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../utils/errors/index.js';
import { builderRepository } from '../../repositories/course-builder/builder.repository.js';

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

async function verifyCourseAccess(courseId: string, actor: ActorContext): Promise<void> {
  if (actor.role === 'student') {
    throw new ForbiddenError('Students cannot access course builder');
  }

  const institutionId = requireTenant(actor);
  const course = await CourseModel.findOne({
    _id: new Types.ObjectId(courseId),
    institutionId: new Types.ObjectId(institutionId),
    deletedAt: null,
  }).exec();

  if (!course) {
    throw new NotFoundError('Course not found');
  }

  if (actor.role === 'faculty') {
    const facultyIdStr = actor.userId;
    const coordinatorIdStr = course.coordinatorId ? String(course.coordinatorId) : null;
    const facultyIdsStr = (course.facultyIds ?? []).map(String);

    if (facultyIdStr !== coordinatorIdStr && !facultyIdsStr.includes(facultyIdStr)) {
      throw new ForbiddenError('You do not have access to this course');
    }
  }
}

function generateSlug(title: string): string {
  return slugify(title, { lower: true, strict: true });
}

class CourseBuilderService {
  async getBuilderTree(courseId: string, actor: ActorContext): Promise<Record<string, unknown>> {
    await verifyCourseAccess(courseId, actor);
    const tree = await builderRepository.getBuilderTree(courseId);

    return {
      modules: tree.map((item) => ({
        ...toDto(item.module),
        lessons: item.lessons.map((lessonItem) => ({
          ...toDto(lessonItem.lesson),
          resources: lessonItem.resources.map((r) => toDto(r)),
        })),
      })),
    };
  }

  async searchBuilder(
    courseId: string,
    query: BuilderSearchQuery,
    actor: ActorContext,
  ): Promise<Record<string, unknown>> {
    await verifyCourseAccess(courseId, actor);
    const result = await builderRepository.searchBuilder(courseId, query);

    return {
      modules: result.modules.map((m) => toDto(m)),
      lessons: result.lessons.map((l) => toDto(l)),
      resources: result.resources.map((r) => toDto(r)),
    };
  }

  async reorder(
    courseId: string,
    data: BuilderReorderInput,
    actor: ActorContext,
  ): Promise<Record<string, unknown>> {
    await verifyCourseAccess(courseId, actor);
    const institutionId = requireTenant(actor);

    if (data.modules && data.modules.length > 0) {
      await builderRepository.reorderModules(data.modules);
    }

    if (data.lessons && data.lessons.length > 0) {
      await builderRepository.reorderLessons(data.lessons);
    }

    if (data.resources && data.resources.length > 0) {
      await builderRepository.reorderResources(data.resources);
    }

    await builderRepository.logAudit({
      event: 'builder.reordered',
      institutionId,
      courseId,
      userId: actor.userId,
      email: actor.email,
      metadata: {
        modulesCount: data.modules?.length ?? 0,
        lessonsCount: data.lessons?.length ?? 0,
        resourcesCount: data.resources?.length ?? 0,
      },
    });

    eventBus.emit(EVENTS.BUILDER_REORDERED, {
      courseId,
      institutionId,
      userId: actor.userId,
      email: actor.email,
      modules: data.modules,
      lessons: data.lessons,
      resources: data.resources,
    });

    return { success: true };
  }

  async listModules(courseId: string, actor: ActorContext): Promise<Record<string, unknown>> {
    await verifyCourseAccess(courseId, actor);
    const modules = await builderRepository.listModulesByCourse(courseId, false);
    return { items: modules.map((m) => toDto(m)) };
  }

  async createModule(
    courseId: string,
    data: CreateCourseModuleInput,
    actor: ActorContext,
  ): Promise<Record<string, unknown>> {
    await verifyCourseAccess(courseId, actor);
    const institutionId = requireTenant(actor);

    const slug = data.slug ?? generateSlug(data.title);
    const moduleCount = await builderRepository.countModulesByCourse(courseId);

    const module = await builderRepository.createModule({
      courseId: new Types.ObjectId(courseId),
      institutionId: new Types.ObjectId(institutionId),
      title: data.title,
      slug,
      description: data.description ?? null,
      moduleNumber: data.moduleNumber ?? moduleCount + 1,
      orderIndex: data.orderIndex ?? moduleCount,
      estimatedMinutes: data.estimatedMinutes ?? null,
      visibility: data.visibility ?? 'enrolled',
      status: data.status ?? 'draft',
      icon: data.icon ?? null,
      color: data.color ?? null,
      isLocked: data.isLocked ?? false,
      unlockAfterModuleId: data.unlockAfterModuleId
        ? new Types.ObjectId(data.unlockAfterModuleId)
        : null,
      createdBy: new Types.ObjectId(actor.userId),
      updatedBy: new Types.ObjectId(actor.userId),
      deletedAt: null,
    });

    await builderRepository.logAudit({
      event: 'module.created',
      institutionId,
      courseId,
      moduleId: String(module._id),
      userId: actor.userId,
      email: actor.email,
      metadata: { title: module.title },
    });

    eventBus.emit(EVENTS.MODULE_CREATED, {
      moduleId: String(module._id),
      courseId,
      institutionId,
      userId: actor.userId,
      email: actor.email,
      title: module.title,
    });

    return toDto(module);
  }

  async getModule(
    courseId: string,
    moduleId: string,
    actor: ActorContext,
  ): Promise<Record<string, unknown>> {
    await verifyCourseAccess(courseId, actor);
    const module = await builderRepository.findModuleById(courseId, moduleId, false);
    if (!module) {
      throw new NotFoundError('Module not found');
    }
    return toDto(module);
  }

  async updateModule(
    courseId: string,
    moduleId: string,
    data: UpdateCourseModuleInput,
    actor: ActorContext,
  ): Promise<Record<string, unknown>> {
    await verifyCourseAccess(courseId, actor);
    const institutionId = requireTenant(actor);

    const module = await builderRepository.findModuleById(courseId, moduleId, false);
    if (!module) {
      throw new NotFoundError('Module not found');
    }

    const updates: Record<string, unknown> = { updatedBy: new Types.ObjectId(actor.userId) };

    if (data.title !== undefined) updates.title = data.title;
    if (data.slug !== undefined) updates.slug = data.slug;
    if (data.description !== undefined) updates.description = data.description;
    if (data.moduleNumber !== undefined) updates.moduleNumber = data.moduleNumber;
    if (data.orderIndex !== undefined) updates.orderIndex = data.orderIndex;
    if (data.estimatedMinutes !== undefined) updates.estimatedMinutes = data.estimatedMinutes;
    if (data.visibility !== undefined) updates.visibility = data.visibility;
    if (data.status !== undefined) updates.status = data.status;
    if (data.icon !== undefined) updates.icon = data.icon;
    if (data.color !== undefined) updates.color = data.color;
    if (data.isLocked !== undefined) updates.isLocked = data.isLocked;
    if (data.unlockAfterModuleId !== undefined) {
      updates.unlockAfterModuleId = data.unlockAfterModuleId
        ? new Types.ObjectId(data.unlockAfterModuleId)
        : null;
    }

    const updated = await builderRepository.updateModule(moduleId, updates);
    if (!updated) {
      throw new NotFoundError('Module not found after update');
    }

    await builderRepository.logAudit({
      event: 'module.updated',
      institutionId,
      courseId,
      moduleId,
      userId: actor.userId,
      email: actor.email,
      metadata: { changes: Object.keys(updates) },
    });

    eventBus.emit(EVENTS.MODULE_UPDATED, {
      moduleId,
      courseId,
      institutionId,
      userId: actor.userId,
      email: actor.email,
      updates: Object.keys(updates),
    });

    return toDto(updated);
  }

  async deleteModule(
    courseId: string,
    moduleId: string,
    actor: ActorContext,
  ): Promise<Record<string, unknown>> {
    await verifyCourseAccess(courseId, actor);
    const institutionId = requireTenant(actor);

    const module = await builderRepository.findModuleById(courseId, moduleId, false);
    if (!module) {
      throw new NotFoundError('Module not found');
    }

    await builderRepository.softDeleteModule(moduleId);

    await builderRepository.logAudit({
      event: 'module.deleted',
      institutionId,
      courseId,
      moduleId,
      userId: actor.userId,
      email: actor.email,
      metadata: { title: module.title },
    });

    eventBus.emit(EVENTS.MODULE_DELETED, {
      moduleId,
      courseId,
      institutionId,
      userId: actor.userId,
      email: actor.email,
      title: module.title,
    });

    return { success: true };
  }

  async restoreModule(
    courseId: string,
    moduleId: string,
    actor: ActorContext,
  ): Promise<Record<string, unknown>> {
    await verifyCourseAccess(courseId, actor);
    const institutionId = requireTenant(actor);

    const module = await builderRepository.findModuleById(courseId, moduleId, true);
    if (!module) {
      throw new NotFoundError('Module not found');
    }

    await builderRepository.restoreModule(moduleId);

    await builderRepository.logAudit({
      event: 'module.restored',
      institutionId,
      courseId,
      moduleId,
      userId: actor.userId,
      email: actor.email,
      metadata: { title: module.title },
    });

    return { success: true };
  }

  async duplicateModule(
    courseId: string,
    moduleId: string,
    actor: ActorContext,
  ): Promise<Record<string, unknown>> {
    await verifyCourseAccess(courseId, actor);
    const institutionId = requireTenant(actor);

    const original = await builderRepository.findModuleById(courseId, moduleId, false);
    if (!original) {
      throw new NotFoundError('Module not found');
    }

    const moduleCount = await builderRepository.countModulesByCourse(courseId);
    const copy = await builderRepository.duplicateModule(original, {
      title: `${original.title} (Copy)`,
      slug: `${original.slug}-copy-${Date.now()}`,
      orderIndex: moduleCount,
      moduleNumber: moduleCount + 1,
      createdBy: new Types.ObjectId(actor.userId),
      updatedBy: new Types.ObjectId(actor.userId),
      deletedAt: null,
    });

    await builderRepository.logAudit({
      event: 'module.duplicated',
      institutionId,
      courseId,
      moduleId: String(copy._id),
      userId: actor.userId,
      email: actor.email,
      metadata: { originalModuleId: moduleId, title: copy.title },
    });

    return toDto(copy);
  }

  async archiveModule(
    courseId: string,
    moduleId: string,
    actor: ActorContext,
  ): Promise<Record<string, unknown>> {
    await verifyCourseAccess(courseId, actor);

    const module = await builderRepository.findModuleById(courseId, moduleId, false);
    if (!module) {
      throw new NotFoundError('Module not found');
    }

    const updated = await builderRepository.updateModule(moduleId, { status: 'archived' });
    if (!updated) {
      throw new NotFoundError('Module not found after update');
    }

    return toDto(updated);
  }

  async listLessons(courseId: string, actor: ActorContext): Promise<Record<string, unknown>> {
    await verifyCourseAccess(courseId, actor);
    const lessons = await builderRepository.listLessonsByCourse(courseId, false);
    return { items: lessons.map((l) => toDto(l)) };
  }

  async createLesson(
    courseId: string,
    data: CreateCourseLessonInput,
    actor: ActorContext,
  ): Promise<Record<string, unknown>> {
    await verifyCourseAccess(courseId, actor);
    const institutionId = requireTenant(actor);

    const module = await builderRepository.findModuleById(courseId, data.moduleId, false);
    if (!module) {
      throw new NotFoundError('Module not found');
    }

    const slug = data.slug ?? generateSlug(data.title);
    const lessonCount = await builderRepository.countLessonsByModule(data.moduleId);

    const lesson = await builderRepository.createLesson({
      courseId: new Types.ObjectId(courseId),
      moduleId: new Types.ObjectId(data.moduleId),
      institutionId: new Types.ObjectId(institutionId),
      title: data.title,
      slug,
      lessonNumber: data.lessonNumber ?? lessonCount + 1,
      orderIndex: data.orderIndex ?? lessonCount,
      description: data.description ?? null,
      summary: data.summary ?? null,
      content: data.content ?? null,
      estimatedMinutes: data.estimatedMinutes ?? null,
      visibility: data.visibility ?? 'enrolled',
      status: data.status ?? 'draft',
      lessonType: data.lessonType ?? 'rich_text',
      allowComments: data.allowComments ?? true,
      allowDownloads: data.allowDownloads ?? true,
      isPreview: data.isPreview ?? false,
      isLocked: data.isLocked ?? false,
      unlockAfterLessonId: data.unlockAfterLessonId
        ? new Types.ObjectId(data.unlockAfterLessonId)
        : null,
      createdBy: new Types.ObjectId(actor.userId),
      updatedBy: new Types.ObjectId(actor.userId),
      deletedAt: null,
    });

    await builderRepository.createLessonVersion({
      courseId: new Types.ObjectId(courseId),
      lessonId: lesson._id,
      institutionId: new Types.ObjectId(institutionId),
      version: 1,
      snapshot: lesson.toObject(),
      createdBy: new Types.ObjectId(actor.userId),
    });

    await builderRepository.logAudit({
      event: 'lesson.created',
      institutionId,
      courseId,
      moduleId: data.moduleId,
      lessonId: String(lesson._id),
      userId: actor.userId,
      email: actor.email,
      metadata: { title: lesson.title },
    });

    eventBus.emit(EVENTS.LESSON_CREATED, {
      lessonId: String(lesson._id),
      moduleId: data.moduleId,
      courseId,
      institutionId,
      userId: actor.userId,
      email: actor.email,
      title: lesson.title,
    });

    return toDto(lesson);
  }

  async getLesson(
    courseId: string,
    lessonId: string,
    actor: ActorContext,
  ): Promise<Record<string, unknown>> {
    await verifyCourseAccess(courseId, actor);
    const lesson = await builderRepository.findLessonById(courseId, lessonId, false);
    if (!lesson) {
      throw new NotFoundError('Lesson not found');
    }
    return toDto(lesson);
  }

  async updateLesson(
    courseId: string,
    lessonId: string,
    data: UpdateCourseLessonInput,
    actor: ActorContext,
  ): Promise<Record<string, unknown>> {
    await verifyCourseAccess(courseId, actor);
    const institutionId = requireTenant(actor);

    const lesson = await builderRepository.findLessonById(courseId, lessonId, false);
    if (!lesson) {
      throw new NotFoundError('Lesson not found');
    }

    const updates: Record<string, unknown> = { updatedBy: new Types.ObjectId(actor.userId) };

    if (data.title !== undefined) updates.title = data.title;
    if (data.slug !== undefined) updates.slug = data.slug;
    if (data.lessonNumber !== undefined) updates.lessonNumber = data.lessonNumber;
    if (data.orderIndex !== undefined) updates.orderIndex = data.orderIndex;
    if (data.description !== undefined) updates.description = data.description;
    if (data.summary !== undefined) updates.summary = data.summary;
    if (data.content !== undefined) updates.content = data.content;
    if (data.estimatedMinutes !== undefined) updates.estimatedMinutes = data.estimatedMinutes;
    if (data.visibility !== undefined) updates.visibility = data.visibility;
    if (data.status !== undefined) updates.status = data.status;
    if (data.lessonType !== undefined) updates.lessonType = data.lessonType;
    if (data.allowComments !== undefined) updates.allowComments = data.allowComments;
    if (data.allowDownloads !== undefined) updates.allowDownloads = data.allowDownloads;
    if (data.isPreview !== undefined) updates.isPreview = data.isPreview;
    if (data.isLocked !== undefined) updates.isLocked = data.isLocked;
    if (data.unlockAfterLessonId !== undefined) {
      updates.unlockAfterLessonId = data.unlockAfterLessonId
        ? new Types.ObjectId(data.unlockAfterLessonId)
        : null;
    }

    const updated = await builderRepository.updateLesson(lessonId, updates);
    if (!updated) {
      throw new NotFoundError('Lesson not found after update');
    }

    if (data.content !== undefined || data.title !== undefined) {
      const latestVersion = await builderRepository.getLatestLessonVersion(lessonId);
      const nextVersion = latestVersion ? latestVersion.version + 1 : 1;

      await builderRepository.createLessonVersion({
        courseId: new Types.ObjectId(courseId),
        lessonId: new Types.ObjectId(lessonId),
        institutionId: new Types.ObjectId(institutionId),
        version: nextVersion,
        snapshot: updated.toObject(),
        createdBy: new Types.ObjectId(actor.userId),
      });
    }

    await builderRepository.logAudit({
      event: 'lesson.updated',
      institutionId,
      courseId,
      moduleId: String(lesson.moduleId),
      lessonId,
      userId: actor.userId,
      email: actor.email,
      metadata: { changes: Object.keys(updates) },
    });

    eventBus.emit(EVENTS.LESSON_UPDATED, {
      lessonId,
      moduleId: String(lesson.moduleId),
      courseId,
      institutionId,
      userId: actor.userId,
      email: actor.email,
      updates: Object.keys(updates),
    });

    return toDto(updated);
  }

  async deleteLesson(
    courseId: string,
    lessonId: string,
    actor: ActorContext,
  ): Promise<Record<string, unknown>> {
    await verifyCourseAccess(courseId, actor);
    const institutionId = requireTenant(actor);

    const lesson = await builderRepository.findLessonById(courseId, lessonId, false);
    if (!lesson) {
      throw new NotFoundError('Lesson not found');
    }

    await builderRepository.softDeleteLesson(lessonId);

    await builderRepository.logAudit({
      event: 'lesson.deleted',
      institutionId,
      courseId,
      moduleId: String(lesson.moduleId),
      lessonId,
      userId: actor.userId,
      email: actor.email,
      metadata: { title: lesson.title },
    });

    eventBus.emit(EVENTS.LESSON_DELETED, {
      lessonId,
      moduleId: String(lesson.moduleId),
      courseId,
      institutionId,
      userId: actor.userId,
      email: actor.email,
      title: lesson.title,
    });

    return { success: true };
  }

  async restoreLesson(
    courseId: string,
    lessonId: string,
    actor: ActorContext,
  ): Promise<Record<string, unknown>> {
    await verifyCourseAccess(courseId, actor);
    const institutionId = requireTenant(actor);

    const lesson = await builderRepository.findLessonById(courseId, lessonId, true);
    if (!lesson) {
      throw new NotFoundError('Lesson not found');
    }

    await builderRepository.restoreLesson(lessonId);

    await builderRepository.logAudit({
      event: 'lesson.restored',
      institutionId,
      courseId,
      moduleId: String(lesson.moduleId),
      lessonId,
      userId: actor.userId,
      email: actor.email,
      metadata: { title: lesson.title },
    });

    return { success: true };
  }

  async duplicateLesson(
    courseId: string,
    lessonId: string,
    actor: ActorContext,
  ): Promise<Record<string, unknown>> {
    await verifyCourseAccess(courseId, actor);
    const institutionId = requireTenant(actor);

    const original = await builderRepository.findLessonById(courseId, lessonId, false);
    if (!original) {
      throw new NotFoundError('Lesson not found');
    }

    const lessonCount = await builderRepository.countLessonsByModule(String(original.moduleId));
    const copy = await builderRepository.duplicateLesson(original, {
      title: `${original.title} (Copy)`,
      slug: `${original.slug}-copy-${Date.now()}`,
      orderIndex: lessonCount,
      lessonNumber: lessonCount + 1,
      createdBy: new Types.ObjectId(actor.userId),
      updatedBy: new Types.ObjectId(actor.userId),
      deletedAt: null,
    });

    await builderRepository.createLessonVersion({
      courseId: new Types.ObjectId(courseId),
      lessonId: copy._id,
      institutionId: new Types.ObjectId(institutionId),
      version: 1,
      snapshot: copy.toObject(),
      createdBy: new Types.ObjectId(actor.userId),
    });

    await builderRepository.logAudit({
      event: 'lesson.duplicated',
      institutionId,
      courseId,
      moduleId: String(original.moduleId),
      lessonId: String(copy._id),
      userId: actor.userId,
      email: actor.email,
      metadata: { originalLessonId: lessonId, title: copy.title },
    });

    return toDto(copy);
  }

  async archiveLesson(
    courseId: string,
    lessonId: string,
    actor: ActorContext,
  ): Promise<Record<string, unknown>> {
    await verifyCourseAccess(courseId, actor);

    const lesson = await builderRepository.findLessonById(courseId, lessonId, false);
    if (!lesson) {
      throw new NotFoundError('Lesson not found');
    }

    const updated = await builderRepository.updateLesson(lessonId, { status: 'archived' });
    if (!updated) {
      throw new NotFoundError('Lesson not found after update');
    }

    return toDto(updated);
  }

  async moveLesson(
    courseId: string,
    lessonId: string,
    data: MoveLessonInput,
    actor: ActorContext,
  ): Promise<Record<string, unknown>> {
    await verifyCourseAccess(courseId, actor);

    const lesson = await builderRepository.findLessonById(courseId, lessonId, false);
    if (!lesson) {
      throw new NotFoundError('Lesson not found');
    }

    const targetModule = await builderRepository.findModuleById(courseId, data.moduleId, false);
    if (!targetModule) {
      throw new NotFoundError('Target module not found');
    }

    await builderRepository.moveLessonToModule(lessonId, data.moduleId, data.orderIndex);

    return { success: true };
  }

  async listLessonVersions(
    courseId: string,
    lessonId: string,
    actor: ActorContext,
  ): Promise<Record<string, unknown>> {
    await verifyCourseAccess(courseId, actor);

    const lesson = await builderRepository.findLessonById(courseId, lessonId, false);
    if (!lesson) {
      throw new NotFoundError('Lesson not found');
    }

    const versions = await builderRepository.listLessonVersions(lessonId);
    return { items: versions.map((v) => toDto(v)) };
  }

  async listResources(
    courseId: string,
    lessonId: string,
    actor: ActorContext,
  ): Promise<Record<string, unknown>> {
    await verifyCourseAccess(courseId, actor);

    const lesson = await builderRepository.findLessonById(courseId, lessonId, false);
    if (!lesson) {
      throw new NotFoundError('Lesson not found');
    }

    const resources = await builderRepository.listResourcesByLesson(lessonId, false);
    return { items: resources.map((r) => toDto(r)) };
  }

  async createResource(
    courseId: string,
    lessonId: string,
    data: CreateCourseResourceInput,
    actor: ActorContext,
  ): Promise<Record<string, unknown>> {
    await verifyCourseAccess(courseId, actor);
    const institutionId = requireTenant(actor);

    const lesson = await builderRepository.findLessonById(courseId, lessonId, false);
    if (!lesson) {
      throw new NotFoundError('Lesson not found');
    }

    const resourceCount = (await builderRepository.listResourcesByLesson(lessonId, false)).length;

    let storageKey: string | null = null;
    let fileName: string | null = data.fileName ?? null;
    let mimeType: string | null = data.mimeType ?? null;
    let size: number | null = data.size ?? null;

    if (data.data && data.contentType) {
      const buffer = Buffer.from(data.data, 'base64');
      const resourceId = new Types.ObjectId();
      const ext = getExtensionFromMimeType(data.contentType);
      storageKey = `courses/${institutionId}/${courseId}/lessons/${lessonId}/resources/${resourceId}.${ext}`;

      await getStorage().put({
        key: storageKey,
        data: buffer,
        contentType: data.contentType,
      });

      fileName = fileName ?? `resource-${resourceId}.${ext}`;
      mimeType = data.contentType;
      size = buffer.length;
    }

    const resource = await builderRepository.createResource({
      courseId: new Types.ObjectId(courseId),
      lessonId: new Types.ObjectId(lessonId),
      institutionId: new Types.ObjectId(institutionId),
      type: data.type,
      title: data.title,
      description: data.description ?? null,
      url: data.url ?? null,
      storageKey,
      fileName,
      mimeType,
      size,
      orderIndex: data.orderIndex ?? resourceCount,
      visibility: data.visibility ?? 'enrolled',
      createdBy: new Types.ObjectId(actor.userId),
      deletedAt: null,
    });

    await builderRepository.logAudit({
      event: 'resource.uploaded',
      institutionId,
      courseId,
      moduleId: String(lesson.moduleId),
      lessonId,
      resourceId: String(resource._id),
      userId: actor.userId,
      email: actor.email,
      metadata: { title: resource.title, type: resource.type },
    });

    eventBus.emit(EVENTS.RESOURCE_UPLOADED, {
      resourceId: String(resource._id),
      lessonId,
      moduleId: String(lesson.moduleId),
      courseId,
      institutionId,
      userId: actor.userId,
      email: actor.email,
      type: resource.type,
      title: resource.title,
    });

    return toDto(resource);
  }

  async updateResource(
    courseId: string,
    lessonId: string,
    resourceId: string,
    data: UpdateCourseResourceInput,
    actor: ActorContext,
  ): Promise<Record<string, unknown>> {
    await verifyCourseAccess(courseId, actor);

    const resource = await builderRepository.findResourceById(lessonId, resourceId, false);
    if (!resource) {
      throw new NotFoundError('Resource not found');
    }

    const updates: Record<string, unknown> = {};

    if (data.type !== undefined) updates.type = data.type;
    if (data.title !== undefined) updates.title = data.title;
    if (data.description !== undefined) updates.description = data.description;
    if (data.url !== undefined) updates.url = data.url;
    if (data.fileName !== undefined) updates.fileName = data.fileName;
    if (data.mimeType !== undefined) updates.mimeType = data.mimeType;
    if (data.size !== undefined) updates.size = data.size;
    if (data.orderIndex !== undefined) updates.orderIndex = data.orderIndex;
    if (data.visibility !== undefined) updates.visibility = data.visibility;

    const updated = await builderRepository.updateResource(resourceId, updates);
    if (!updated) {
      throw new NotFoundError('Resource not found after update');
    }

    return toDto(updated);
  }

  async deleteResource(
    courseId: string,
    lessonId: string,
    resourceId: string,
    actor: ActorContext,
  ): Promise<Record<string, unknown>> {
    await verifyCourseAccess(courseId, actor);
    const institutionId = requireTenant(actor);

    const resource = await builderRepository.findResourceById(lessonId, resourceId, false);
    if (!resource) {
      throw new NotFoundError('Resource not found');
    }

    await builderRepository.softDeleteResource(resourceId);

    if (resource.storageKey) {
      try {
        await getStorage().delete(resource.storageKey);
      } catch (err) {
        logger.warn('Failed to delete resource from storage', { storageKey: resource.storageKey });
      }
    }

    await builderRepository.logAudit({
      event: 'resource.deleted',
      institutionId,
      courseId,
      lessonId,
      resourceId,
      userId: actor.userId,
      email: actor.email,
      metadata: { title: resource.title, type: resource.type },
    });

    eventBus.emit(EVENTS.RESOURCE_DELETED, {
      resourceId,
      lessonId,
      courseId,
      institutionId,
      userId: actor.userId,
      email: actor.email,
      type: resource.type,
      title: resource.title,
    });

    return { success: true };
  }

  async autosave(
    courseId: string,
    lessonId: string,
    content: string,
    actor: ActorContext,
  ): Promise<Record<string, unknown>> {
    await verifyCourseAccess(courseId, actor);
    const institutionId = requireTenant(actor);

    const lesson = await builderRepository.findLessonById(courseId, lessonId, false);
    if (!lesson) {
      throw new NotFoundError('Lesson not found');
    }

    const updated = await builderRepository.updateLesson(lessonId, {
      content,
      updatedBy: new Types.ObjectId(actor.userId),
    });

    if (!updated) {
      throw new NotFoundError('Lesson not found after update');
    }

    const latestVersion = await builderRepository.getLatestLessonVersion(lessonId);
    const nextVersion = latestVersion ? latestVersion.version + 1 : 1;

    await builderRepository.createLessonVersion({
      courseId: new Types.ObjectId(courseId),
      lessonId: new Types.ObjectId(lessonId),
      institutionId: new Types.ObjectId(institutionId),
      version: nextVersion,
      snapshot: updated.toObject(),
      createdBy: new Types.ObjectId(actor.userId),
    });

    await builderRepository.logAudit({
      event: 'builder.saved',
      institutionId,
      courseId,
      moduleId: String(lesson.moduleId),
      lessonId,
      userId: actor.userId,
      email: actor.email,
      metadata: { autosave: true, version: nextVersion },
    });

    eventBus.emit(EVENTS.BUILDER_SAVED, {
      lessonId,
      moduleId: String(lesson.moduleId),
      courseId,
      institutionId,
      userId: actor.userId,
      email: actor.email,
      version: nextVersion,
    });

    return { success: true, version: nextVersion };
  }
}

function getExtensionFromMimeType(mimeType: string): string {
  const map: Record<string, string> = {
    'application/pdf': 'pdf',
    'application/zip': 'zip',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'video/mp4': 'mp4',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'text/markdown': 'md',
    'text/html': 'html',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'application/octet-stream': 'bin',
  };
  return map[mimeType] ?? 'bin';
}

export const courseBuilderService = new CourseBuilderService();
