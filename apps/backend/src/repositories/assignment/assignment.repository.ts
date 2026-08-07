import { Types } from 'mongoose';
import type { AssignmentListQuery, SubmissionListQuery } from '@learnova/validation';
import { AssignmentModel, type AssignmentDocument } from '../../models/assignment.model.js';
import {
  AssignmentSubmissionModel,
  type AssignmentSubmissionDocument,
} from '../../models/assignment-submission.model.js';
import {
  AssignmentRubricModel,
  type AssignmentRubricDocument,
} from '../../models/assignment-rubric.model.js';
import {
  AssignmentGradeModel,
  type AssignmentGradeDocument,
} from '../../models/assignment-grade.model.js';
import {
  AssignmentCommentModel,
  type AssignmentCommentDocument,
} from '../../models/assignment-comment.model.js';
import {
  AssignmentAttachmentModel,
  type AssignmentAttachmentDocument,
} from '../../models/assignment-attachment.model.js';
import {
  AssignmentAuditLogModel,
  type AssignmentAuditEvent,
} from '../../models/assignment-audit-log.model.js';

export interface AssignmentListResult {
  items: AssignmentDocument[];
  total: number;
  page: number;
  limit: number;
}

export interface SubmissionListResult {
  items: AssignmentSubmissionDocument[];
  total: number;
  page: number;
  limit: number;
}

export interface RubricListResult {
  items: AssignmentRubricDocument[];
  total: number;
  page: number;
  limit: number;
}

export interface AssignmentStats {
  total: number;
  draft: number;
  published: number;
  closed: number;
  archived: number;
  totalSubmissions: number;
  gradedSubmissions: number;
  lateSubmissions: number;
  averageGrade: number | null;
  byDepartment: { departmentId: string | null; label: string; count: number }[];
  byCourse: { courseId: string; courseCode: string; title: string; count: number }[];
  byStatus: { status: string; count: number }[];
  byType: { assignmentType: string; count: number }[];
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toObjectId(id: string) {
  return new Types.ObjectId(id);
}

export class AssignmentRepository {
  // ---------------------------------------------------------------- assignments

  buildAssignmentFilter(
    institutionId: string,
    query: Partial<AssignmentListQuery>,
    now: Date = new Date(),
  ): Record<string, unknown> {
    const filter: Record<string, unknown> = {
      institutionId: toObjectId(institutionId),
      deletedAt: null,
    };

    if (query.courseId) filter.courseId = toObjectId(query.courseId);
    if (query.moduleId) filter.moduleId = toObjectId(query.moduleId);
    if (query.lessonId) filter.lessonId = toObjectId(query.lessonId);
    if (query.status) filter.status = query.status;
    if (query.assignmentType) filter.assignmentType = query.assignmentType;
    if (query.createdBy) filter.createdBy = toObjectId(query.createdBy);
    if (query.published !== undefined) {
      filter.status = query.published ? 'published' : { $ne: 'published' };
    }

    if (query.due === 'upcoming') {
      filter.dueDate = { $gte: now };
    } else if (query.due === 'overdue') {
      filter.dueDate = { $lt: now, $ne: null };
    } else if (query.due === 'none') {
      filter.dueDate = null;
    }

    if (query.q) {
      const regex = new RegExp(escapeRegex(query.q), 'i');
      filter.$or = [{ title: regex }, { description: regex }, { instructions: regex }];
    }

    return filter;
  }

  async listAssignments(
    filter: Record<string, unknown>,
    query: Pick<AssignmentListQuery, 'page' | 'limit' | 'sortBy' | 'sortOrder'>,
  ): Promise<AssignmentListResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sortField = query.sortBy ?? 'createdAt';
    const sortDir = query.sortOrder === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      AssignmentModel.find(filter)
        .sort({ [sortField]: sortDir })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      AssignmentModel.countDocuments(filter).exec(),
    ]);

    return { items, total, page, limit };
  }

  async findAssignmentById(
    institutionId: string,
    id: string,
  ): Promise<AssignmentDocument | null> {
    return AssignmentModel.findOne({
      _id: id,
      institutionId: toObjectId(institutionId),
      deletedAt: null,
    }).exec();
  }

  async findAssignmentsByIds(
    institutionId: string,
    ids: string[],
  ): Promise<AssignmentDocument[]> {
    return AssignmentModel.find({
      _id: { $in: ids.map(toObjectId) },
      institutionId: toObjectId(institutionId),
      deletedAt: null,
    }).exec();
  }

  async createAssignment(data: Record<string, unknown>): Promise<AssignmentDocument> {
    return AssignmentModel.create(data);
  }

  async updateAssignmentById(
    institutionId: string,
    id: string,
    data: Record<string, unknown>,
  ): Promise<AssignmentDocument | null> {
    return AssignmentModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId), deletedAt: null },
      { $set: data },
      { new: true },
    ).exec();
  }

  async pushAssignmentAttachment(
    institutionId: string,
    id: string,
    fileRef: Record<string, unknown>,
  ): Promise<AssignmentDocument | null> {
    return AssignmentModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId), deletedAt: null },
      { $push: { attachments: fileRef } },
      { new: true },
    ).exec();
  }

  async softDeleteAssignment(
    institutionId: string,
    id: string,
  ): Promise<AssignmentDocument | null> {
    return AssignmentModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId), deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true },
    ).exec();
  }

  async hardDeleteAssignment(institutionId: string, id: string): Promise<boolean> {
    const res = await AssignmentModel.deleteOne({
      _id: id,
      institutionId: toObjectId(institutionId),
    }).exec();
    return res.deletedCount > 0;
  }

  // ---------------------------------------------------------------- submissions

  buildSubmissionFilter(
    institutionId: string,
    query: Partial<SubmissionListQuery>,
  ): Record<string, unknown> {
    const filter: Record<string, unknown> = {
      institutionId: toObjectId(institutionId),
      deletedAt: null,
    };

    if (query.assignmentId) filter.assignmentId = toObjectId(query.assignmentId);
    if (query.courseId) filter.courseId = toObjectId(query.courseId);
    if (query.studentId) filter.studentId = toObjectId(query.studentId);
    if (query.status) filter.status = query.status;
    if (query.late !== undefined) filter.lateSubmission = query.late;
    if (query.graded !== undefined) {
      filter.gradeId = query.graded ? { $ne: null } : null;
    }
    if (query.q) {
      const regex = new RegExp(escapeRegex(query.q), 'i');
      filter.textSubmission = regex;
    }

    return filter;
  }

  async listSubmissions(
    filter: Record<string, unknown>,
    query: Pick<SubmissionListQuery, 'page' | 'limit' | 'sortBy' | 'sortOrder'>,
  ): Promise<SubmissionListResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sortField = query.sortBy ?? 'createdAt';
    const sortDir = query.sortOrder === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      AssignmentSubmissionModel.find(filter)
        .sort({ [sortField]: sortDir })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      AssignmentSubmissionModel.countDocuments(filter).exec(),
    ]);

    return { items, total, page, limit };
  }

  async findSubmissionById(
    institutionId: string,
    id: string,
  ): Promise<AssignmentSubmissionDocument | null> {
    return AssignmentSubmissionModel.findOne({
      _id: id,
      institutionId: toObjectId(institutionId),
      deletedAt: null,
    }).exec();
  }

  async findDraftSubmission(
    assignmentId: string,
    studentId: string,
  ): Promise<AssignmentSubmissionDocument | null> {
    return AssignmentSubmissionModel.findOne({
      assignmentId: toObjectId(assignmentId),
      studentId: toObjectId(studentId),
      status: 'draft',
      deletedAt: null,
    }).exec();
  }

  async findLatestSubmission(
    assignmentId: string,
    studentId: string,
  ): Promise<AssignmentSubmissionDocument | null> {
    return AssignmentSubmissionModel.findOne({
      assignmentId: toObjectId(assignmentId),
      studentId: toObjectId(studentId),
      deletedAt: null,
    })
      .sort({ attemptNumber: -1 })
      .exec();
  }

  async countStudentAttempts(assignmentId: string, studentId: string): Promise<number> {
    return AssignmentSubmissionModel.countDocuments({
      assignmentId: toObjectId(assignmentId),
      studentId: toObjectId(studentId),
      status: { $ne: 'draft' },
      deletedAt: null,
    }).exec();
  }

  async createSubmission(data: Record<string, unknown>): Promise<AssignmentSubmissionDocument> {
    return AssignmentSubmissionModel.create(data);
  }

  async updateSubmissionById(
    institutionId: string,
    id: string,
    data: Record<string, unknown>,
  ): Promise<AssignmentSubmissionDocument | null> {
    return AssignmentSubmissionModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId), deletedAt: null },
      { $set: data },
      { new: true },
    ).exec();
  }

  async pushSubmissionFile(
    institutionId: string,
    id: string,
    fileRef: Record<string, unknown>,
  ): Promise<AssignmentSubmissionDocument | null> {
    return AssignmentSubmissionModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId), deletedAt: null },
      { $push: { files: fileRef } },
      { new: true },
    ).exec();
  }

  // ---------------------------------------------------------------- rubrics

  async listRubrics(
    institutionId: string,
    query: { page?: number; limit?: number; q?: string },
  ): Promise<RubricListResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const filter: Record<string, unknown> = {
      institutionId: toObjectId(institutionId),
      deletedAt: null,
    };
    if (query.q) filter.title = new RegExp(escapeRegex(query.q), 'i');

    const [items, total] = await Promise.all([
      AssignmentRubricModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      AssignmentRubricModel.countDocuments(filter).exec(),
    ]);

    return { items, total, page, limit };
  }

  async findRubricById(
    institutionId: string,
    id: string,
  ): Promise<AssignmentRubricDocument | null> {
    return AssignmentRubricModel.findOne({
      _id: id,
      institutionId: toObjectId(institutionId),
      deletedAt: null,
    }).exec();
  }

  async createRubric(data: Record<string, unknown>): Promise<AssignmentRubricDocument> {
    return AssignmentRubricModel.create(data);
  }

  async updateRubricById(
    institutionId: string,
    id: string,
    data: Record<string, unknown>,
  ): Promise<AssignmentRubricDocument | null> {
    return AssignmentRubricModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId), deletedAt: null },
      { $set: data },
      { new: true },
    ).exec();
  }

  async softDeleteRubric(
    institutionId: string,
    id: string,
  ): Promise<AssignmentRubricDocument | null> {
    return AssignmentRubricModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId), deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true },
    ).exec();
  }

  // ---------------------------------------------------------------- grades

  async createGrade(data: Record<string, unknown>): Promise<AssignmentGradeDocument> {
    return AssignmentGradeModel.create(data);
  }

  async findGradeById(
    institutionId: string,
    id: string,
  ): Promise<AssignmentGradeDocument | null> {
    return AssignmentGradeModel.findOne({
      _id: id,
      institutionId: toObjectId(institutionId),
      deletedAt: null,
    }).exec();
  }

  async findGradeBySubmission(
    submissionId: string,
  ): Promise<AssignmentGradeDocument | null> {
    return AssignmentGradeModel.findOne({
      submissionId: toObjectId(submissionId),
      deletedAt: null,
    }).exec();
  }

  async softDeleteGradesForSubmission(submissionId: string): Promise<number> {
    const res = await AssignmentGradeModel.updateMany(
      { submissionId: toObjectId(submissionId), deletedAt: null },
      { $set: { deletedAt: new Date() } },
    ).exec();
    return res.modifiedCount;
  }

  // ---------------------------------------------------------------- comments

  async listComments(
    institutionId: string,
    assignmentId: string,
    submissionId?: string | null,
  ): Promise<AssignmentCommentDocument[]> {
    const filter: Record<string, unknown> = {
      institutionId: toObjectId(institutionId),
      assignmentId: toObjectId(assignmentId),
      deletedAt: null,
    };
    if (submissionId) filter.submissionId = toObjectId(submissionId);

    return AssignmentCommentModel.find(filter).sort({ createdAt: 1 }).exec();
  }

  async findCommentById(
    institutionId: string,
    id: string,
  ): Promise<AssignmentCommentDocument | null> {
    return AssignmentCommentModel.findOne({
      _id: id,
      institutionId: toObjectId(institutionId),
      deletedAt: null,
    }).exec();
  }

  async createComment(data: Record<string, unknown>): Promise<AssignmentCommentDocument> {
    return AssignmentCommentModel.create(data);
  }

  async softDeleteComment(
    institutionId: string,
    id: string,
  ): Promise<AssignmentCommentDocument | null> {
    return AssignmentCommentModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId), deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true },
    ).exec();
  }

  // ---------------------------------------------------------------- attachments

  async createAttachment(
    data: Record<string, unknown>,
  ): Promise<AssignmentAttachmentDocument> {
    return AssignmentAttachmentModel.create(data);
  }

  async listAttachments(
    institutionId: string,
    filters: { assignmentId?: string; submissionId?: string; commentId?: string },
  ): Promise<AssignmentAttachmentDocument[]> {
    const filter: Record<string, unknown> = {
      institutionId: toObjectId(institutionId),
      deletedAt: null,
    };
    if (filters.assignmentId) filter.assignmentId = toObjectId(filters.assignmentId);
    if (filters.submissionId) filter.submissionId = toObjectId(filters.submissionId);
    if (filters.commentId) filter.commentId = toObjectId(filters.commentId);

    return AssignmentAttachmentModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async softDeleteAttachment(
    institutionId: string,
    id: string,
  ): Promise<AssignmentAttachmentDocument | null> {
    return AssignmentAttachmentModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId), deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true },
    ).exec();
  }

  // ---------------------------------------------------------------- counters

  async countAssignments(filter: Record<string, unknown>): Promise<number> {
    return AssignmentModel.countDocuments(filter).exec();
  }

  async countSubmissions(filter: Record<string, unknown>): Promise<number> {
    return AssignmentSubmissionModel.countDocuments(filter).exec();
  }

  async averageGrade(filter: Record<string, unknown>): Promise<number | null> {
    const rows = await AssignmentGradeModel.aggregate<{ avg: number | null }>([
      { $match: { ...filter, deletedAt: null, percentage: { $ne: null } } },
      { $group: { _id: null, avg: { $avg: '$percentage' } } },
    ]);
    const avg = rows[0]?.avg;
    return typeof avg === 'number' ? Math.round(avg * 100) / 100 : null;
  }

  async countGradesForAssignments(
    institutionId: string,
    assignmentIds: Types.ObjectId[],
  ): Promise<number> {
    if (assignmentIds.length === 0) return 0;
    return AssignmentGradeModel.countDocuments({
      institutionId: toObjectId(institutionId),
      assignmentId: { $in: assignmentIds },
      deletedAt: null,
    }).exec();
  }

  async getStats(institutionId: string): Promise<AssignmentStats> {
    const oid = toObjectId(institutionId);
    const base = { institutionId: oid, deletedAt: null };

    const [
      total,
      draft,
      published,
      closed,
      archived,
      totalSubmissions,
      gradedSubmissions,
      lateSubmissions,
      averageGrade,
      byDepartmentRaw,
      byCourseRaw,
      byStatusRaw,
      byTypeRaw,
    ] = await Promise.all([
      AssignmentModel.countDocuments(base),
      AssignmentModel.countDocuments({ ...base, status: 'draft' }),
      AssignmentModel.countDocuments({ ...base, status: 'published' }),
      AssignmentModel.countDocuments({ ...base, status: 'closed' }),
      AssignmentModel.countDocuments({ ...base, status: 'archived' }),
      AssignmentSubmissionModel.countDocuments({ ...base, status: { $ne: 'draft' } }),
      AssignmentSubmissionModel.countDocuments({ ...base, status: 'graded' }),
      AssignmentSubmissionModel.countDocuments({ ...base, lateSubmission: true }),
      this.averageGrade({ institutionId: oid }),
      AssignmentModel.aggregate([
        { $match: base },
        {
          $lookup: {
            from: 'courses',
            localField: 'courseId',
            foreignField: '_id',
            as: 'course',
          },
        },
        {
          $group: {
            _id: { $arrayElemAt: ['$course.departmentId', 0] },
            count: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: 'departments',
            localField: '_id',
            foreignField: '_id',
            as: 'department',
          },
        },
        {
          $project: {
            departmentId: { $cond: [{ $eq: ['$_id', null] }, null, { $toString: '$_id' }] },
            label: { $ifNull: [{ $arrayElemAt: ['$department.name', 0] }, 'Unassigned'] },
            count: 1,
          },
        },
        { $sort: { count: -1 } },
      ]),
      AssignmentModel.aggregate([
        { $match: base },
        { $group: { _id: '$courseId', count: { $sum: 1 } } },
        {
          $lookup: { from: 'courses', localField: '_id', foreignField: '_id', as: 'course' },
        },
        {
          $project: {
            courseId: { $toString: '$_id' },
            courseCode: { $ifNull: [{ $arrayElemAt: ['$course.courseCode', 0] }, ''] },
            title: { $ifNull: [{ $arrayElemAt: ['$course.title', 0] }, 'Unknown'] },
            count: 1,
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      AssignmentModel.aggregate([
        { $match: base },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      AssignmentModel.aggregate([
        { $match: base },
        { $group: { _id: '$assignmentType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    return {
      total,
      draft,
      published,
      closed,
      archived,
      totalSubmissions,
      gradedSubmissions,
      lateSubmissions,
      averageGrade,
      byDepartment: byDepartmentRaw as AssignmentStats['byDepartment'],
      byCourse: byCourseRaw as AssignmentStats['byCourse'],
      byStatus: byStatusRaw.map((row) => ({
        status: String(row._id),
        count: row.count as number,
      })),
      byType: byTypeRaw.map((row) => ({
        assignmentType: String(row._id),
        count: row.count as number,
      })),
    };
  }

  // ---------------------------------------------------------------- audit

  async listAudit(institutionId: string, assignmentId?: string, limit = 50) {
    const filter: Record<string, unknown> = { institutionId: toObjectId(institutionId) };
    if (assignmentId) filter.assignmentId = toObjectId(assignmentId);
    return AssignmentAuditLogModel.find(filter).sort({ createdAt: -1 }).limit(limit).exec();
  }

  async logAudit(input: {
    event: AssignmentAuditEvent;
    institutionId: string;
    assignmentId?: string | null;
    submissionId?: string | null;
    courseId?: string | null;
    studentId?: string | null;
    userId?: string | null;
    email?: string | null;
    metadata?: Record<string, unknown>;
  }) {
    return AssignmentAuditLogModel.create({
      event: input.event,
      institutionId: toObjectId(input.institutionId),
      assignmentId: input.assignmentId ? toObjectId(input.assignmentId) : null,
      submissionId: input.submissionId ? toObjectId(input.submissionId) : null,
      courseId: input.courseId ? toObjectId(input.courseId) : null,
      studentId: input.studentId ? toObjectId(input.studentId) : null,
      userId: input.userId ? toObjectId(input.userId) : null,
      email: input.email ?? null,
      metadata: input.metadata ?? {},
    });
  }
}

export const assignmentRepository = new AssignmentRepository();
