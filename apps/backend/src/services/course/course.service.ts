/**
 * Course Service - business logic for course operations
 */

import { Types } from 'mongoose';
import { courseRepository } from '../../repositories/course/course.repository.js';
import { NotFoundError, ConflictError } from '../../utils/errors/index.js';
import type { Course, CourseStats } from '@learnova/types';
import type { CreateCourseBody, UpdateCourseBody, ListCoursesQuery } from '@learnova/validation';
import { PAGINATION } from '@learnova/constants';

function toObjectId(id: string) {
  return new Types.ObjectId(id);
}

export const courseService = {
  async getCourse(id: string): Promise<Course> {
    const course = await courseRepository.findById(id);
    if (!course) {
      throw new NotFoundError('Course not found');
    }
    return course;
  },

  async listCourses(params: ListCoursesQuery, institutionId: string) {
    const filter: Record<string, unknown> = {
      institutionId: toObjectId(institutionId),
      deletedAt: null,
    };

    if (params.q) {
      const regex = new RegExp(params.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { title: regex },
        { courseCode: regex },
        { description: regex },
        { tags: regex },
      ];
    }

    if (params.status) filter.status = params.status;
    if (params.departmentId) filter.departmentId = toObjectId(params.departmentId);
    if (params.programId) filter.programId = toObjectId(params.programId);
    if (params.semesterId) filter.semesterId = toObjectId(params.semesterId);
    if (params.facultyId) filter.facultyIds = toObjectId(params.facultyId);
    if (!params.includeArchived && !params.status) {
      filter.status = { $ne: 'archived' };
    }

    const page = params.page || PAGINATION.DEFAULT_PAGE;
    const limit = params.limit || PAGINATION.DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const result = await courseRepository.list(filter, skip, limit);

    return {
      items: result.items,
      meta: {
        page,
        limit,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / limit)),
        hasNextPage: page < Math.ceil(result.total / limit),
        hasPrevPage: page > 1,
      },
    };
  },

  async createCourse(data: CreateCourseBody, institutionId: string, userId: string): Promise<Course> {
    const existing = await courseRepository.findBySlug(data.slug, institutionId);
    if (existing) {
      throw new ConflictError('Course with this slug already exists');
    }

    return courseRepository.create({
      courseCode: data.courseCode,
      title: data.title,
      slug: data.slug,
      description: data.description ?? null,
      institutionId: toObjectId(institutionId),
      departmentId: data.departmentId ? toObjectId(data.departmentId) : null,
      programId: data.programId ? toObjectId(data.programId) : null,
      semesterId: data.semesterId ? toObjectId(data.semesterId) : null,
      credits: data.credits ?? 0,
      status: data.status ?? 'draft',
      facultyIds: (data.facultyIds ?? []).map(toObjectId),
      coordinatorId: data.coordinatorId ? toObjectId(data.coordinatorId) : null,
      thumbnailUrl: data.thumbnailUrl ?? null,
      bannerUrl: data.bannerUrl ?? null,
      objectives: data.objectives ?? [],
      prerequisites: data.prerequisites ?? [],
      syllabus: data.syllabus ?? null,
      tags: data.tags ?? [],
      isActive: data.isActive ?? true,
      createdBy: toObjectId(userId),
      updatedBy: toObjectId(userId),
      deletedAt: null,
    });
  },

  async updateCourse(id: string, data: UpdateCourseBody, userId: string): Promise<Course> {
    const course = await courseRepository.findById(id);
    if (!course) {
      throw new NotFoundError('Course not found');
    }

    if (data.slug && data.slug !== course.slug) {
      const existing = await courseRepository.findBySlug(data.slug, course.institutionId);
      if (existing) {
        throw new ConflictError('Course with this slug already exists');
      }
    }

    const patch: Record<string, unknown> = {
      updatedBy: toObjectId(userId),
    };

    if (data.courseCode !== undefined) patch.courseCode = data.courseCode;
    if (data.title !== undefined) patch.title = data.title;
    if (data.slug !== undefined) patch.slug = data.slug;
    if (data.description !== undefined) patch.description = data.description;
    if (data.departmentId !== undefined) {
      patch.departmentId = data.departmentId ? toObjectId(data.departmentId) : null;
    }
    if (data.programId !== undefined) {
      patch.programId = data.programId ? toObjectId(data.programId) : null;
    }
    if (data.semesterId !== undefined) {
      patch.semesterId = data.semesterId ? toObjectId(data.semesterId) : null;
    }
    if (data.credits !== undefined) patch.credits = data.credits;
    if (data.status !== undefined) patch.status = data.status;
    if (data.facultyIds !== undefined) patch.facultyIds = data.facultyIds.map(toObjectId);
    if (data.coordinatorId !== undefined) {
      patch.coordinatorId = data.coordinatorId ? toObjectId(data.coordinatorId) : null;
    }
    if (data.thumbnailUrl !== undefined) patch.thumbnailUrl = data.thumbnailUrl;
    if (data.bannerUrl !== undefined) patch.bannerUrl = data.bannerUrl;
    if (data.objectives !== undefined) patch.objectives = data.objectives;
    if (data.prerequisites !== undefined) patch.prerequisites = data.prerequisites;
    if (data.syllabus !== undefined) patch.syllabus = data.syllabus;
    if (data.tags !== undefined) patch.tags = data.tags;
    if (data.isActive !== undefined) patch.isActive = data.isActive;

    const updated = await courseRepository.update(id, patch);
    if (!updated) {
      throw new NotFoundError('Course not found');
    }
    return updated;
  },

  async deleteCourse(id: string): Promise<void> {
    const deleted = await courseRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError('Course not found');
    }
  },

  async publishCourse(id: string, userId: string): Promise<Course> {
    const updated = await courseRepository.update(id, {
      status: 'published',
      publishedAt: new Date(),
      archivedAt: null,
      isActive: true,
      updatedBy: toObjectId(userId),
    });
    if (!updated) throw new NotFoundError('Course not found');
    return updated;
  },

  async archiveCourse(id: string, userId: string): Promise<Course> {
    const updated = await courseRepository.update(id, {
      status: 'archived',
      archivedAt: new Date(),
      isActive: false,
      updatedBy: toObjectId(userId),
    });
    if (!updated) throw new NotFoundError('Course not found');
    return updated;
  },

  async getCourseStats(institutionId: string): Promise<CourseStats> {
    return courseRepository.stats(institutionId);
  },
};
