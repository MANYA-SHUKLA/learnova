import { Types } from 'mongoose';
import type { BuilderSearchQuery } from '@learnova/validation';
import {
  CourseModuleModel,
  type CourseModuleDocument,
} from '../../models/course-module.model.js';
import {
  CourseLessonModel,
  type CourseLessonDocument,
} from '../../models/course-lesson.model.js';
import {
  CourseResourceModel,
  type CourseResourceDocument,
} from '../../models/course-resource.model.js';
import {
  CourseLessonVersionModel,
  type CourseLessonVersionDocument,
} from '../../models/course-lesson-version.model.js';
import {
  CourseBuilderAuditLogModel,
  type CourseBuilderAuditEvent,
} from '../../models/course-builder-audit-log.model.js';

function toObjectId(id: string) {
  return new Types.ObjectId(id);
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export interface BuilderTreeModule {
  module: CourseModuleDocument;
  lessons: Array<{
    lesson: CourseLessonDocument;
    resources: CourseResourceDocument[];
  }>;
}

export class BuilderRepository {
  async findModuleById(
    courseId: string,
    moduleId: string,
    includeDeleted = false,
  ): Promise<CourseModuleDocument | null> {
    const filter: Record<string, unknown> = {
      _id: toObjectId(moduleId),
      courseId: toObjectId(courseId),
    };
    if (!includeDeleted) {
      filter.deletedAt = null;
    }
    return CourseModuleModel.findOne(filter).exec();
  }

  async listModulesByCourse(
    courseId: string,
    includeDeleted = false,
  ): Promise<CourseModuleDocument[]> {
    const filter: Record<string, unknown> = { courseId: toObjectId(courseId) };
    if (!includeDeleted) {
      filter.deletedAt = null;
    }
    return CourseModuleModel.find(filter).sort({ orderIndex: 1 }).exec();
  }

  async createModule(data: Partial<CourseModuleDocument>): Promise<CourseModuleDocument> {
    const doc = new CourseModuleModel(data);
    return doc.save();
  }

  async updateModule(
    moduleId: string,
    updates: Partial<CourseModuleDocument>,
  ): Promise<CourseModuleDocument | null> {
    return CourseModuleModel.findByIdAndUpdate(moduleId, { $set: updates }, { new: true }).exec();
  }

  async softDeleteModule(moduleId: string): Promise<void> {
    await CourseModuleModel.findByIdAndUpdate(moduleId, {
      $set: { deletedAt: new Date() },
    }).exec();
  }

  async restoreModule(moduleId: string): Promise<void> {
    await CourseModuleModel.findByIdAndUpdate(moduleId, {
      $set: { deletedAt: null },
    }).exec();
  }

  async duplicateModule(
    original: CourseModuleDocument,
    newData: Partial<CourseModuleDocument>,
  ): Promise<CourseModuleDocument> {
    const copy = new CourseModuleModel({
      ...original.toObject(),
      _id: new Types.ObjectId(),
      ...newData,
      createdAt: undefined,
      updatedAt: undefined,
    });
    return copy.save();
  }

  async countModulesByCourse(courseId: string): Promise<number> {
    return CourseModuleModel.countDocuments({
      courseId: toObjectId(courseId),
      deletedAt: null,
    }).exec();
  }

  async findLessonById(
    courseId: string,
    lessonId: string,
    includeDeleted = false,
  ): Promise<CourseLessonDocument | null> {
    const filter: Record<string, unknown> = {
      _id: toObjectId(lessonId),
      courseId: toObjectId(courseId),
    };
    if (!includeDeleted) {
      filter.deletedAt = null;
    }
    return CourseLessonModel.findOne(filter).exec();
  }

  async listLessonsByModule(
    moduleId: string,
    includeDeleted = false,
  ): Promise<CourseLessonDocument[]> {
    const filter: Record<string, unknown> = { moduleId: toObjectId(moduleId) };
    if (!includeDeleted) {
      filter.deletedAt = null;
    }
    return CourseLessonModel.find(filter).sort({ orderIndex: 1 }).exec();
  }

  async listLessonsByCourse(
    courseId: string,
    includeDeleted = false,
  ): Promise<CourseLessonDocument[]> {
    const filter: Record<string, unknown> = { courseId: toObjectId(courseId) };
    if (!includeDeleted) {
      filter.deletedAt = null;
    }
    return CourseLessonModel.find(filter).sort({ orderIndex: 1 }).exec();
  }

  async createLesson(data: Partial<CourseLessonDocument>): Promise<CourseLessonDocument> {
    const doc = new CourseLessonModel(data);
    return doc.save();
  }

  async updateLesson(
    lessonId: string,
    updates: Partial<CourseLessonDocument>,
  ): Promise<CourseLessonDocument | null> {
    return CourseLessonModel.findByIdAndUpdate(lessonId, { $set: updates }, { new: true }).exec();
  }

  async softDeleteLesson(lessonId: string): Promise<void> {
    await CourseLessonModel.findByIdAndUpdate(lessonId, {
      $set: { deletedAt: new Date() },
    }).exec();
  }

  async restoreLesson(lessonId: string): Promise<void> {
    await CourseLessonModel.findByIdAndUpdate(lessonId, {
      $set: { deletedAt: null },
    }).exec();
  }

  async duplicateLesson(
    original: CourseLessonDocument,
    newData: Partial<CourseLessonDocument>,
  ): Promise<CourseLessonDocument> {
    const copy = new CourseLessonModel({
      ...original.toObject(),
      _id: new Types.ObjectId(),
      ...newData,
      createdAt: undefined,
      updatedAt: undefined,
    });
    return copy.save();
  }

  async moveLessonToModule(
    lessonId: string,
    newModuleId: string,
    newOrderIndex?: number,
  ): Promise<void> {
    const updates: Record<string, unknown> = { moduleId: toObjectId(newModuleId) };
    if (newOrderIndex !== undefined) {
      updates.orderIndex = newOrderIndex;
    }
    await CourseLessonModel.findByIdAndUpdate(lessonId, { $set: updates }).exec();
  }

  async countLessonsByModule(moduleId: string): Promise<number> {
    return CourseLessonModel.countDocuments({
      moduleId: toObjectId(moduleId),
      deletedAt: null,
    }).exec();
  }

  async findResourceById(
    lessonId: string,
    resourceId: string,
    includeDeleted = false,
  ): Promise<CourseResourceDocument | null> {
    const filter: Record<string, unknown> = {
      _id: toObjectId(resourceId),
      lessonId: toObjectId(lessonId),
    };
    if (!includeDeleted) {
      filter.deletedAt = null;
    }
    return CourseResourceModel.findOne(filter).exec();
  }

  async listResourcesByLesson(
    lessonId: string,
    includeDeleted = false,
  ): Promise<CourseResourceDocument[]> {
    const filter: Record<string, unknown> = { lessonId: toObjectId(lessonId) };
    if (!includeDeleted) {
      filter.deletedAt = null;
    }
    return CourseResourceModel.find(filter).sort({ orderIndex: 1 }).exec();
  }

  async createResource(data: Partial<CourseResourceDocument>): Promise<CourseResourceDocument> {
    const doc = new CourseResourceModel(data);
    return doc.save();
  }

  async updateResource(
    resourceId: string,
    updates: Partial<CourseResourceDocument>,
  ): Promise<CourseResourceDocument | null> {
    return CourseResourceModel.findByIdAndUpdate(
      resourceId,
      { $set: updates },
      { new: true },
    ).exec();
  }

  async softDeleteResource(resourceId: string): Promise<void> {
    await CourseResourceModel.findByIdAndUpdate(resourceId, {
      $set: { deletedAt: new Date() },
    }).exec();
  }

  async getLatestLessonVersion(lessonId: string): Promise<CourseLessonVersionDocument | null> {
    return CourseLessonVersionModel.findOne({ lessonId: toObjectId(lessonId) })
      .sort({ version: -1 })
      .exec();
  }

  async listLessonVersions(lessonId: string): Promise<CourseLessonVersionDocument[]> {
    return CourseLessonVersionModel.find({ lessonId: toObjectId(lessonId) })
      .sort({ version: -1 })
      .exec();
  }

  async createLessonVersion(
    data: Partial<CourseLessonVersionDocument>,
  ): Promise<CourseLessonVersionDocument> {
    const doc = new CourseLessonVersionModel(data);
    return doc.save();
  }

  async reorderModules(updates: Array<{ id: string; orderIndex: number }>): Promise<void> {
    const bulk = CourseModuleModel.collection.initializeUnorderedBulkOp();
    for (const { id, orderIndex } of updates) {
      bulk.find({ _id: toObjectId(id) }).updateOne({ $set: { orderIndex } });
    }
    if (updates.length > 0) {
      await bulk.execute();
    }
  }

  async reorderLessons(updates: Array<{ id: string; orderIndex: number }>): Promise<void> {
    const bulk = CourseLessonModel.collection.initializeUnorderedBulkOp();
    for (const { id, orderIndex } of updates) {
      bulk.find({ _id: toObjectId(id) }).updateOne({ $set: { orderIndex } });
    }
    if (updates.length > 0) {
      await bulk.execute();
    }
  }

  async reorderResources(updates: Array<{ id: string; orderIndex: number }>): Promise<void> {
    const bulk = CourseResourceModel.collection.initializeUnorderedBulkOp();
    for (const { id, orderIndex } of updates) {
      bulk.find({ _id: toObjectId(id) }).updateOne({ $set: { orderIndex } });
    }
    if (updates.length > 0) {
      await bulk.execute();
    }
  }

  async getBuilderTree(courseId: string): Promise<BuilderTreeModule[]> {
    const modules = await this.listModulesByCourse(courseId, false);
    const moduleIds = modules.map((m) => m._id);

    const lessons = await CourseLessonModel.find({
      moduleId: { $in: moduleIds },
      deletedAt: null,
    })
      .sort({ orderIndex: 1 })
      .exec();

    const lessonIds = lessons.map((l) => l._id);
    const resources = await CourseResourceModel.find({
      lessonId: { $in: lessonIds },
      deletedAt: null,
    })
      .sort({ orderIndex: 1 })
      .exec();

    const resourcesByLesson = new Map<string, CourseResourceDocument[]>();
    for (const resource of resources) {
      const lessonIdStr = String(resource.lessonId);
      if (!resourcesByLesson.has(lessonIdStr)) {
        resourcesByLesson.set(lessonIdStr, []);
      }
      resourcesByLesson.get(lessonIdStr)!.push(resource);
    }

    const lessonsByModule = new Map<string, CourseLessonDocument[]>();
    for (const lesson of lessons) {
      const moduleIdStr = String(lesson.moduleId);
      if (!lessonsByModule.has(moduleIdStr)) {
        lessonsByModule.set(moduleIdStr, []);
      }
      lessonsByModule.get(moduleIdStr)!.push(lesson);
    }

    return modules.map((module) => {
      const moduleIdStr = String(module._id);
      const moduleLessons = lessonsByModule.get(moduleIdStr) ?? [];
      return {
        module,
        lessons: moduleLessons.map((lesson) => ({
          lesson,
          resources: resourcesByLesson.get(String(lesson._id)) ?? [],
        })),
      };
    });
  }

  async searchBuilder(
    courseId: string,
    query: BuilderSearchQuery,
  ): Promise<{
    modules: CourseModuleDocument[];
    lessons: CourseLessonDocument[];
    resources: CourseResourceDocument[];
  }> {
    const modules: CourseModuleDocument[] = [];
    const lessons: CourseLessonDocument[] = [];
    const resources: CourseResourceDocument[] = [];

    if (query.q) {
      const regex = new RegExp(escapeRegex(query.q), 'i');

      const moduleFilter: Record<string, unknown> = {
        courseId: toObjectId(courseId),
        deletedAt: null,
        $or: [{ title: regex }, { description: regex }],
      };
      modules.push(...(await CourseModuleModel.find(moduleFilter).sort({ orderIndex: 1 }).exec()));

      const lessonFilter: Record<string, unknown> = {
        courseId: toObjectId(courseId),
        deletedAt: null,
        $or: [{ title: regex }, { description: regex }, { content: regex }],
      };
      if (query.lessonType) lessonFilter.lessonType = query.lessonType;
      if (query.status) lessonFilter.status = query.status;
      if (query.isLocked !== undefined) lessonFilter.isLocked = query.isLocked;
      if (query.isPreview !== undefined) lessonFilter.isPreview = query.isPreview;
      lessons.push(...(await CourseLessonModel.find(lessonFilter).sort({ orderIndex: 1 }).exec()));

      const resourceFilter: Record<string, unknown> = {
        courseId: toObjectId(courseId),
        deletedAt: null,
        $or: [{ title: regex }, { description: regex }],
      };
      resources.push(
        ...(await CourseResourceModel.find(resourceFilter).sort({ orderIndex: 1 }).exec()),
      );
    }

    return { modules, lessons, resources };
  }

  async logAudit(data: {
    event: CourseBuilderAuditEvent;
    institutionId: string;
    courseId: string;
    moduleId?: string;
    lessonId?: string;
    resourceId?: string;
    userId?: string;
    email?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const doc = new CourseBuilderAuditLogModel({
      event: data.event,
      institutionId: toObjectId(data.institutionId),
      courseId: toObjectId(data.courseId),
      moduleId: data.moduleId ? toObjectId(data.moduleId) : null,
      lessonId: data.lessonId ? toObjectId(data.lessonId) : null,
      resourceId: data.resourceId ? toObjectId(data.resourceId) : null,
      userId: data.userId ? toObjectId(data.userId) : null,
      email: data.email ?? null,
      metadata: data.metadata ?? {},
    });
    await doc.save();
  }
}

export const builderRepository = new BuilderRepository();
