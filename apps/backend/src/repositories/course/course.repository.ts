/**
 * Course Repository - handles database operations for courses
 */

import type { Types } from 'mongoose';
import { CourseModel, type CourseDocument } from '../../models/course.model.js';
import type { Course } from '@learnova/types';

function toDTO(doc: CourseDocument): Course {
  return {
    id: String(doc._id),
    courseCode: doc.courseCode,
    title: doc.title,
    slug: doc.slug,
    description: doc.description,
    institutionId: String(doc.institutionId),
    departmentId: doc.departmentId ? String(doc.departmentId) : null,
    programId: doc.programId ? String(doc.programId) : null,
    semesterId: doc.semesterId ? String(doc.semesterId) : null,
    credits: doc.credits,
    status: doc.status,
    facultyIds: doc.facultyIds.map((id) => String(id)),
    coordinatorId: doc.coordinatorId ? String(doc.coordinatorId) : null,
    thumbnailUrl: doc.thumbnailUrl,
    bannerUrl: doc.bannerUrl,
    objectives: doc.objectives,
    prerequisites: doc.prerequisites,
    syllabus: doc.syllabus,
    tags: doc.tags,
    isActive: doc.isActive,
    publishedAt: doc.publishedAt,
    archivedAt: doc.archivedAt,
    createdBy: doc.createdBy ? String(doc.createdBy) : null,
    updatedBy: doc.updatedBy ? String(doc.updatedBy) : null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    deletedAt: doc.deletedAt,
  };
}

export const courseRepository = {
  findById: async (id: string): Promise<Course | null> => {
    const doc = await CourseModel.findById(id).lean();
    return doc ? toDTO(doc as CourseDocument) : null;
  },

  findBySlug: async (slug: string, institutionId: string): Promise<Course | null> => {
    const doc = await CourseModel.findOne({ slug, institutionId }).lean();
    return doc ? toDTO(doc as CourseDocument) : null;
  },

  list: async (filter: Record<string, unknown>, skip: number, limit: number) => {
    const [docs, total] = await Promise.all([
      CourseModel.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }).lean(),
      CourseModel.countDocuments(filter),
    ]);
    return {
      items: docs.map((doc) => toDTO(doc as CourseDocument)),
      total,
    };
  },

  create: async (data: Partial<CourseDocument>): Promise<Course> => {
    const doc = await CourseModel.create(data);
    return toDTO(doc);
  },

  update: async (id: string, data: Partial<CourseDocument>): Promise<Course | null> => {
    const doc = await CourseModel.findByIdAndUpdate(id, data, { new: true }).lean();
    return doc ? toDTO(doc as CourseDocument) : null;
  },

  delete: async (id: string): Promise<boolean> => {
    const result = await CourseModel.findByIdAndUpdate(id, { deletedAt: new Date() });
    return Boolean(result);
  },

  stats: async (institutionId: string) => {
    const [total, published, draft, archived] = await Promise.all([
      CourseModel.countDocuments({ institutionId, deletedAt: null }),
      CourseModel.countDocuments({ institutionId, status: 'published', deletedAt: null }),
      CourseModel.countDocuments({ institutionId, status: 'draft', deletedAt: null }),
      CourseModel.countDocuments({ institutionId, status: 'archived', deletedAt: null }),
    ]);
    return { total, published, draft, archived, byDepartment: {} };
  },
};
