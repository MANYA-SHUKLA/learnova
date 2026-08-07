/**
 * Course Service - business logic for course operations
 */

import type { Types } from 'mongoose';
import { courseRepository } from '../../repositories/course/course.repository.js';
import { NotFoundError, ConflictError } from '../../utils/errors/index.js';
import type { Course, CourseStats } from '@learnova/types';
import type { CreateCourseBody, UpdateCourseBody, ListCoursesQuery } from '@learnova/validation';
import { PAGINATION } from '@learnova/constants';

export const courseService = {
  async getCourse(id: string): Promise<Course> {
    const course = await courseRepository.findById(id);
    if (!course) {
      throw new NotFoundError('Course not found');
    }
    return course;
  },

  async listCourses(params: ListCoursesQuery, institutionId: string) {
    const filter: Record<string, unknown> = { institutionId, deletedAt: null };
    
    if (params.q) {
      filter.$or = [
        { title: { $regex: params.q, $options: 'i' } },
        { courseCode: { $regex: params.q, $options: 'i' } },
        { description: { $regex: params.q, $options: 'i' } },
      ];
    }
    
    if (params.status) filter.status = params.status;
    if (params.departmentId) filter.departmentId = params.departmentId;
    if (params.programId) filter.programId = params.programId;
    if (params.semesterId) filter.semesterId = params.semesterId;
    if (params.facultyId) filter.facultyIds = params.facultyId;
    if (!params.includeArchived) {
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
        totalPages: Math.ceil(result.total / limit),
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
      ...data,
      institutionId,
      createdBy: userId,
      updatedBy: userId,
    } as Parameters<typeof courseRepository.create>[0]);
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
    
    const updated = await courseRepository.update(id, {
      ...data,
      updatedBy: userId,
    } as Parameters<typeof courseRepository.update>[1]);
    
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
    return this.updateCourse(
      id,
      { status: 'published', publishedAt: new Date().toISOString() } as UpdateCourseBody,
      userId,
    );
  },

  async archiveCourse(id: string, userId: string): Promise<Course> {
    return this.updateCourse(
      id,
      { status: 'archived', archivedAt: new Date().toISOString() } as UpdateCourseBody,
      userId,
    );
  },

  async getCourseStats(institutionId: string): Promise<CourseStats> {
    return courseRepository.stats(institutionId);
  },
};
