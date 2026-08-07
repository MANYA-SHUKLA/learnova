/**
 * Course Repository - handles database operations for courses
 */

import { Types } from 'mongoose';
import { CourseModel, type CourseDocument } from '../../models/course.model.js';
import type { Course } from '@learnova/types';

function toDTO(doc: CourseDocument): Course {
  return {
    id: String(doc._id),
    courseCode: doc.courseCode,
    title: doc.title,
    slug: doc.slug,
    description: doc.description ?? null,
    institutionId: String(doc.institutionId),
    departmentId: doc.departmentId ? String(doc.departmentId) : null,
    programId: doc.programId ? String(doc.programId) : null,
    semesterId: doc.semesterId ? String(doc.semesterId) : null,
    credits: doc.credits ?? 0,
    status: doc.status,
    facultyIds: (doc.facultyIds ?? []).map((id) => String(id)),
    coordinatorId: doc.coordinatorId ? String(doc.coordinatorId) : null,
    thumbnailUrl: doc.thumbnailUrl ?? null,
    bannerUrl: doc.bannerUrl ?? null,
    objectives: doc.objectives ?? [],
    prerequisites: doc.prerequisites ?? [],
    syllabus: doc.syllabus ?? null,
    tags: doc.tags ?? [],
    isActive: doc.isActive ?? true,
    publishedAt: doc.publishedAt ?? null,
    archivedAt: doc.archivedAt ?? null,
    createdBy: doc.createdBy ? String(doc.createdBy) : null,
    updatedBy: doc.updatedBy ? String(doc.updatedBy) : null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    deletedAt: doc.deletedAt ?? null,
  };
}

function toObjectId(id: string) {
  return new Types.ObjectId(id);
}

export const courseRepository = {
  findById: async (id: string): Promise<Course | null> => {
    const doc = await CourseModel.findById(id).exec();
    return doc ? toDTO(doc) : null;
  },

  findBySlug: async (slug: string, institutionId: string): Promise<Course | null> => {
    const doc = await CourseModel.findOne({
      slug,
      institutionId: toObjectId(institutionId),
      deletedAt: null,
    }).exec();
    return doc ? toDTO(doc) : null;
  },

  list: async (filter: Record<string, unknown>, skip: number, limit: number) => {
    const [docs, total] = await Promise.all([
      CourseModel.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }).exec(),
      CourseModel.countDocuments(filter).exec(),
    ]);
    return {
      items: docs.map((doc) => toDTO(doc)),
      total,
    };
  },

  create: async (data: Record<string, unknown>): Promise<Course> => {
    const doc = await CourseModel.create(data);
    return toDTO(doc);
  },

  update: async (id: string, data: Record<string, unknown>): Promise<Course | null> => {
    const doc = await CourseModel.findByIdAndUpdate(id, { $set: data }, { new: true }).exec();
    return doc ? toDTO(doc) : null;
  },

  delete: async (id: string): Promise<boolean> => {
    const result = await CourseModel.findByIdAndUpdate(id, {
      $set: { deletedAt: new Date(), status: 'archived', isActive: false },
    }).exec();
    return Boolean(result);
  },

  stats: async (institutionId: string) => {
    const oid = toObjectId(institutionId);
    const [total, published, draft, archived] = await Promise.all([
      CourseModel.countDocuments({ institutionId: oid, deletedAt: null }),
      CourseModel.countDocuments({ institutionId: oid, status: 'published', deletedAt: null }),
      CourseModel.countDocuments({ institutionId: oid, status: 'draft', deletedAt: null }),
      CourseModel.countDocuments({ institutionId: oid, status: 'archived', deletedAt: null }),
    ]);
    return { total, published, draft, archived, byDepartment: {} as Record<string, number> };
  },
};
