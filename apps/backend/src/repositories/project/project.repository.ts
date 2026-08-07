import { Types } from 'mongoose';
import type {
  ProjectListQuery,
  ProjectSubmissionListQuery,
  ProjectTeamListQuery,
} from '@learnova/validation';
import { ProjectModel, type ProjectDocument } from '../../models/project.model.js';
import {
  ProjectMilestoneModel,
  type ProjectMilestoneDocument,
} from '../../models/project-milestone.model.js';
import {
  ProjectTeamModel,
  type ProjectTeamDocument,
} from '../../models/project-team.model.js';
import {
  ProjectSubmissionModel,
  type ProjectSubmissionDocument,
} from '../../models/project-submission.model.js';
import {
  ProjectReviewModel,
  type ProjectReviewDocument,
} from '../../models/project-review.model.js';
import {
  ProjectMemberModel,
  type ProjectMemberDocument,
} from '../../models/project-member.model.js';
import {
  ProjectCommentModel,
  type ProjectCommentDocument,
} from '../../models/project-comment.model.js';
import {
  ProjectTagModel,
  type ProjectTagDocument,
} from '../../models/project-tag.model.js';
import {
  ProjectCategoryModel,
  type ProjectCategoryDocument,
} from '../../models/project-category.model.js';
import {
  ProjectGradeModel,
  type ProjectGradeDocument,
} from '../../models/project-grade.model.js';
import {
  ProjectProgressModel,
  type ProjectProgressDocument,
} from '../../models/project-progress.model.js';
import {
  ProjectAuditLogModel,
  type ProjectAuditEvent,
} from '../../models/project-audit-log.model.js';

export interface ProjectListResult {
  items: ProjectDocument[];
  total: number;
  page: number;
  limit: number;
}

export interface SubmissionListResult {
  items: ProjectSubmissionDocument[];
  total: number;
  page: number;
  limit: number;
}

export interface TeamListResult {
  items: ProjectTeamDocument[];
  total: number;
  page: number;
  limit: number;
}

export interface MilestoneListResult {
  items: ProjectMilestoneDocument[];
  total: number;
}

export interface ProjectStats {
  total: number;
  draft: number;
  published: number;
  closed: number;
  archived: number;
  totalTeams: number;
  totalSubmissions: number;
  gradedSubmissions: number;
  lateSubmissions: number;
  averageGrade: number | null;
  byDepartment: { departmentId: string | null; label: string; count: number }[];
  byCourse: { courseId: string; courseCode: string; title: string; count: number }[];
  byStatus: { status: string; count: number }[];
  byType: { projectType: string; count: number }[];
}

export type ExtendedProjectListQuery = Partial<ProjectListQuery> & {
  facultyId?: string;
  sortBy?: ProjectListQuery['sortBy'] | 'newest' | 'oldest';
};

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toObjectId(id: string) {
  return new Types.ObjectId(id);
}

export class ProjectRepository {
  // ------------------------------------------------------------------ projects

  buildProjectFilter(
    institutionId: string,
    query: ExtendedProjectListQuery,
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
    if (query.projectType) filter.projectType = query.projectType;
    if (query.createdBy) filter.createdBy = toObjectId(query.createdBy);
    if (query.categoryId) filter.categoryId = toObjectId(query.categoryId);
    if (query.difficulty) filter.difficulty = query.difficulty;
    if (query.facultyId) {
      filter.assignedFacultyIds = toObjectId(query.facultyId);
    }
    if (query.tagId) {
      filter.tags = toObjectId(query.tagId);
    }
    if (query.published !== undefined) {
      filter.status = query.published ? { $in: ['published', 'open'] } : { $nin: ['published', 'open'] };
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
      filter.$or = [{ title: regex }, { description: regex }, { instructions: regex }, { objective: regex }];
    }

    return filter;
  }

  resolveProjectSort(
    query: Pick<ExtendedProjectListQuery, 'sortBy' | 'sortOrder'>,
  ): { field: string; dir: 1 | -1 } {
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    switch (query.sortBy) {
      case 'newest':
        return { field: 'createdAt', dir: -1 };
      case 'oldest':
        return { field: 'createdAt', dir: 1 };
      case 'deadline':
        return { field: 'dueDate', dir: sortOrder };
      case 'difficulty':
        return { field: 'difficulty', dir: sortOrder };
      case 'title':
        return { field: 'title', dir: sortOrder };
      default:
        return { field: query.sortBy ?? 'createdAt', dir: sortOrder };
    }
  }

  async slugExists(institutionId: string, slug: string, excludeId?: string): Promise<boolean> {
    const filter: Record<string, unknown> = {
      institutionId: toObjectId(institutionId),
      slug,
      deletedAt: null,
    };
    if (excludeId) filter._id = { $ne: toObjectId(excludeId) };
    const count = await ProjectModel.countDocuments(filter).exec();
    return count > 0;
  }

  async createMilestonesBulk(data: Record<string, unknown>[]): Promise<void> {
    if (data.length === 0) return;
    await ProjectMilestoneModel.insertMany(data, { ordered: false });
  }

  async bulkUpdateProjectStatus(
    institutionId: string,
    ids: string[],
    status: string,
  ): Promise<number> {
    const res = await ProjectModel.updateMany(
      {
        _id: { $in: ids.map(toObjectId) },
        institutionId: toObjectId(institutionId),
        deletedAt: null,
      },
      { $set: { status } },
    ).exec();
    return res.modifiedCount;
  }

  async bulkSoftDeleteProjects(institutionId: string, ids: string[]): Promise<number> {
    const res = await ProjectModel.updateMany(
      {
        _id: { $in: ids.map(toObjectId) },
        institutionId: toObjectId(institutionId),
        deletedAt: null,
      },
      { $set: { deletedAt: new Date(), status: 'archived' } },
    ).exec();
    return res.modifiedCount;
  }

  async bulkAssignFaculty(
    institutionId: string,
    ids: string[],
    facultyIds: string[],
  ): Promise<number> {
    const res = await ProjectModel.updateMany(
      {
        _id: { $in: ids.map(toObjectId) },
        institutionId: toObjectId(institutionId),
        deletedAt: null,
      },
      { $addToSet: { assignedFacultyIds: { $each: facultyIds.map(toObjectId) } } },
    ).exec();
    return res.modifiedCount;
  }

  async listProjects(
    filter: Record<string, unknown>,
    query: Pick<ExtendedProjectListQuery, 'page' | 'limit' | 'sortBy' | 'sortOrder'>,
  ): Promise<ProjectListResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { field: sortField, dir: sortDir } = this.resolveProjectSort(query);

    const [items, total] = await Promise.all([
      ProjectModel.find(filter)
        .sort({ [sortField]: sortDir })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      ProjectModel.countDocuments(filter).exec(),
    ]);

    return { items, total, page, limit };
  }

  async findProjectById(
    institutionId: string,
    id: string,
  ): Promise<ProjectDocument | null> {
    return ProjectModel.findOne({
      _id: id,
      institutionId: toObjectId(institutionId),
      deletedAt: null,
    }).exec();
  }

  async createProject(data: Record<string, unknown>): Promise<ProjectDocument> {
    return ProjectModel.create(data);
  }

  async updateProjectById(
    institutionId: string,
    id: string,
    data: Record<string, unknown>,
  ): Promise<ProjectDocument | null> {
    return ProjectModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId), deletedAt: null },
      { $set: data },
      { new: true },
    ).exec();
  }

  async pushProjectAttachment(
    institutionId: string,
    id: string,
    fileRef: Record<string, unknown>,
  ): Promise<ProjectDocument | null> {
    return ProjectModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId), deletedAt: null },
      { $push: { attachments: fileRef } },
      { new: true },
    ).exec();
  }

  async softDeleteProject(
    institutionId: string,
    id: string,
  ): Promise<ProjectDocument | null> {
    return ProjectModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId), deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true },
    ).exec();
  }

  async countProjects(filter: Record<string, unknown>): Promise<number> {
    return ProjectModel.countDocuments(filter).exec();
  }

  // ---------------------------------------------------------------- milestones

  async listMilestones(
    institutionId: string,
    projectId: string,
  ): Promise<MilestoneListResult> {
    const filter = {
      institutionId: toObjectId(institutionId),
      projectId: toObjectId(projectId),
      deletedAt: null,
    };
    const items = await ProjectMilestoneModel.find(filter).sort({ order: 1 }).exec();
    return { items, total: items.length };
  }

  async findMilestoneById(
    institutionId: string,
    id: string,
  ): Promise<ProjectMilestoneDocument | null> {
    return ProjectMilestoneModel.findOne({
      _id: id,
      institutionId: toObjectId(institutionId),
      deletedAt: null,
    }).exec();
  }

  async createMilestone(data: Record<string, unknown>): Promise<ProjectMilestoneDocument> {
    return ProjectMilestoneModel.create(data);
  }

  async updateMilestoneById(
    institutionId: string,
    id: string,
    data: Record<string, unknown>,
  ): Promise<ProjectMilestoneDocument | null> {
    return ProjectMilestoneModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId), deletedAt: null },
      { $set: data },
      { new: true },
    ).exec();
  }

  async softDeleteMilestone(
    institutionId: string,
    id: string,
  ): Promise<ProjectMilestoneDocument | null> {
    return ProjectMilestoneModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId), deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true },
    ).exec();
  }

  async countMilestones(projectId: string): Promise<number> {
    return ProjectMilestoneModel.countDocuments({
      projectId: toObjectId(projectId),
      deletedAt: null,
    }).exec();
  }

  async countCompletedMilestones(projectId: string): Promise<number> {
    return ProjectMilestoneModel.countDocuments({
      projectId: toObjectId(projectId),
      status: 'completed',
      deletedAt: null,
    }).exec();
  }

  // --------------------------------------------------------------------- teams

  buildTeamFilter(
    institutionId: string,
    query: Partial<ProjectTeamListQuery>,
  ): Record<string, unknown> {
    const filter: Record<string, unknown> = {
      institutionId: toObjectId(institutionId),
      deletedAt: null,
    };
    if (query.projectId) filter.projectId = toObjectId(query.projectId);
    if (query.courseId) filter.courseId = toObjectId(query.courseId);
    if (query.status) filter.status = query.status;
    return filter;
  }

  async listTeams(
    filter: Record<string, unknown>,
    query: Pick<ProjectTeamListQuery, 'page' | 'limit' | 'sortBy' | 'sortOrder'>,
  ): Promise<TeamListResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sortField = query.sortBy ?? 'createdAt';
    const sortDir = query.sortOrder === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      ProjectTeamModel.find(filter)
        .sort({ [sortField]: sortDir })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      ProjectTeamModel.countDocuments(filter).exec(),
    ]);

    return { items, total, page, limit };
  }

  async findTeamById(
    institutionId: string,
    id: string,
  ): Promise<ProjectTeamDocument | null> {
    return ProjectTeamModel.findOne({
      _id: id,
      institutionId: toObjectId(institutionId),
      deletedAt: null,
    }).exec();
  }

  async findTeamByMember(
    institutionId: string,
    projectId: string,
    studentId: string,
  ): Promise<ProjectTeamDocument | null> {
    const member = await ProjectMemberModel.findOne({
      institutionId: toObjectId(institutionId),
      projectId: toObjectId(projectId),
      studentId: toObjectId(studentId),
      invitationStatus: 'accepted',
      deletedAt: null,
    }).exec();
    if (!member) return null;
    return ProjectTeamModel.findOne({
      _id: member.teamId,
      institutionId: toObjectId(institutionId),
      deletedAt: null,
    }).exec();
  }

  async createTeam(data: Record<string, unknown>): Promise<ProjectTeamDocument> {
    return ProjectTeamModel.create(data);
  }

  async updateTeamById(
    institutionId: string,
    id: string,
    data: Record<string, unknown>,
  ): Promise<ProjectTeamDocument | null> {
    return ProjectTeamModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId), deletedAt: null },
      { $set: data },
      { new: true },
    ).exec();
  }

  async softDeleteTeam(
    institutionId: string,
    id: string,
  ): Promise<ProjectTeamDocument | null> {
    return ProjectTeamModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId), deletedAt: null },
      { $set: { deletedAt: new Date(), status: 'rejected' } },
      { new: true },
    ).exec();
  }

  async countTeams(filter: Record<string, unknown>): Promise<number> {
    return ProjectTeamModel.countDocuments(filter).exec();
  }

  // --------------------------------------------------------------- submissions

  buildSubmissionFilter(
    institutionId: string,
    query: Partial<ProjectSubmissionListQuery>,
  ): Record<string, unknown> {
    const filter: Record<string, unknown> = {
      institutionId: toObjectId(institutionId),
      deletedAt: null,
    };

    if (query.projectId) filter.projectId = toObjectId(query.projectId);
    if (query.courseId) filter.courseId = toObjectId(query.courseId);
    if (query.studentId) filter.studentId = toObjectId(query.studentId);
    if (query.teamId) filter.teamId = toObjectId(query.teamId);
    if (query.milestoneId) filter.milestoneId = toObjectId(query.milestoneId);
    if (query.status) filter.status = query.status;
    if (query.late !== undefined) filter.lateSubmission = query.late;
    if (query.graded !== undefined) {
      filter.gradeId = query.graded ? { $ne: null } : null;
    }
    if (query.q) {
      const regex = new RegExp(escapeRegex(query.q), 'i');
      filter.submissionText = regex;
    }

    return filter;
  }

  async listSubmissions(
    filter: Record<string, unknown>,
    query: Pick<ProjectSubmissionListQuery, 'page' | 'limit' | 'sortBy' | 'sortOrder'>,
  ): Promise<SubmissionListResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sortField = query.sortBy ?? 'createdAt';
    const sortDir = query.sortOrder === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      ProjectSubmissionModel.find(filter)
        .sort({ [sortField]: sortDir })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      ProjectSubmissionModel.countDocuments(filter).exec(),
    ]);

    return { items, total, page, limit };
  }

  async findSubmissionById(
    institutionId: string,
    id: string,
  ): Promise<ProjectSubmissionDocument | null> {
    return ProjectSubmissionModel.findOne({
      _id: id,
      institutionId: toObjectId(institutionId),
      deletedAt: null,
    }).exec();
  }

  async findDraftSubmission(
    projectId: string,
    studentId: string | null,
    teamId: string | null,
    milestoneId: string | null,
  ): Promise<ProjectSubmissionDocument | null> {
    const filter: Record<string, unknown> = {
      projectId: toObjectId(projectId),
      status: 'draft',
      deletedAt: null,
    };
    if (studentId) filter.studentId = toObjectId(studentId);
    if (teamId) filter.teamId = toObjectId(teamId);
    filter.milestoneId = milestoneId ? toObjectId(milestoneId) : null;
    return ProjectSubmissionModel.findOne(filter).exec();
  }

  async countAttempts(
    projectId: string,
    studentId: string | null,
    teamId: string | null,
  ): Promise<number> {
    const filter: Record<string, unknown> = {
      projectId: toObjectId(projectId),
      status: { $ne: 'draft' },
      deletedAt: null,
    };
    if (studentId) filter.studentId = toObjectId(studentId);
    if (teamId) filter.teamId = toObjectId(teamId);
    return ProjectSubmissionModel.countDocuments(filter).exec();
  }

  async createSubmission(data: Record<string, unknown>): Promise<ProjectSubmissionDocument> {
    return ProjectSubmissionModel.create(data);
  }

  async updateSubmissionById(
    institutionId: string,
    id: string,
    data: Record<string, unknown>,
  ): Promise<ProjectSubmissionDocument | null> {
    return ProjectSubmissionModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId), deletedAt: null },
      { $set: data },
      { new: true },
    ).exec();
  }

  async pushSubmissionFile(
    institutionId: string,
    id: string,
    fileRef: Record<string, unknown>,
  ): Promise<ProjectSubmissionDocument | null> {
    return ProjectSubmissionModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId), deletedAt: null },
      { $push: { attachments: fileRef } },
      { new: true },
    ).exec();
  }

  async countSubmissions(filter: Record<string, unknown>): Promise<number> {
    return ProjectSubmissionModel.countDocuments(filter).exec();
  }

  // ------------------------------------------------------------------- reviews

  async findReviewById(
    institutionId: string,
    id: string,
  ): Promise<ProjectReviewDocument | null> {
    return ProjectReviewModel.findOne({
      _id: id,
      institutionId: toObjectId(institutionId),
      deletedAt: null,
    }).exec();
  }

  async createReview(data: Record<string, unknown>): Promise<ProjectReviewDocument> {
    return ProjectReviewModel.create(data);
  }

  async updateReviewById(
    institutionId: string,
    id: string,
    data: Record<string, unknown>,
  ): Promise<ProjectReviewDocument | null> {
    return ProjectReviewModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId), deletedAt: null },
      { $set: data },
      { new: true },
    ).exec();
  }

  async countReviews(filter: Record<string, unknown>): Promise<number> {
    return ProjectReviewModel.countDocuments(filter).exec();
  }

  // --------------------------------------------------------------------- grades

  async createGrade(data: Record<string, unknown>): Promise<ProjectGradeDocument> {
    return ProjectGradeModel.create(data);
  }

  async findGradeBySubmission(submissionId: string): Promise<ProjectGradeDocument | null> {
    return ProjectGradeModel.findOne({
      submissionId: toObjectId(submissionId),
      deletedAt: null,
    }).exec();
  }

  async softDeleteGradesForSubmission(submissionId: string): Promise<number> {
    const res = await ProjectGradeModel.updateMany(
      { submissionId: toObjectId(submissionId), deletedAt: null },
      { $set: { deletedAt: new Date() } },
    ).exec();
    return res.modifiedCount;
  }

  async averageGrade(filter: Record<string, unknown>): Promise<number | null> {
    const rows = await ProjectGradeModel.aggregate<{ avg: number | null }>([
      { $match: { ...filter, deletedAt: null, percentage: { $ne: null } } },
      { $group: { _id: null, avg: { $avg: '$percentage' } } },
    ]);
    const avg = rows[0]?.avg;
    return typeof avg === 'number' ? Math.round(avg * 100) / 100 : null;
  }

  // ------------------------------------------------------------------ progress

  async findOrCreateProgress(
    filter: Record<string, unknown>,
    defaults: Record<string, unknown>,
  ): Promise<ProjectProgressDocument> {
    const existing = await ProjectProgressModel.findOne(filter).exec();
    if (existing) return existing;
    return ProjectProgressModel.create({ ...filter, ...defaults });
  }

  async updateProgress(
    institutionId: string,
    projectId: string,
    studentId: string,
    data: Record<string, unknown>,
  ): Promise<ProjectProgressDocument | null> {
    return ProjectProgressModel.findOneAndUpdate(
      {
        institutionId: toObjectId(institutionId),
        projectId: toObjectId(projectId),
        studentId: toObjectId(studentId),
        deletedAt: null,
      },
      { $set: data },
      { new: true, upsert: true },
    ).exec();
  }

  async countProgress(filter: Record<string, unknown>): Promise<number> {
    return ProjectProgressModel.countDocuments(filter).exec();
  }

  // --------------------------------------------------------------------- stats

  async getStats(institutionId: string): Promise<ProjectStats> {
    const oid = toObjectId(institutionId);
    const base = { institutionId: oid, deletedAt: null };

    const [
      total,
      draft,
      published,
      closed,
      archived,
      totalTeams,
      totalSubmissions,
      gradedSubmissions,
      lateSubmissions,
      averageGrade,
      byDepartmentRaw,
      byCourseRaw,
      byStatusRaw,
      byTypeRaw,
    ] = await Promise.all([
      ProjectModel.countDocuments(base),
      ProjectModel.countDocuments({ ...base, status: 'draft' }),
      ProjectModel.countDocuments({ ...base, status: 'published' }),
      ProjectModel.countDocuments({ ...base, status: 'closed' }),
      ProjectModel.countDocuments({ ...base, status: 'archived' }),
      ProjectTeamModel.countDocuments({ ...base, status: { $in: ['approved', 'completed'] } }),
      ProjectSubmissionModel.countDocuments({ ...base, status: { $ne: 'draft' } }),
      ProjectSubmissionModel.countDocuments({ ...base, status: 'graded' }),
      ProjectSubmissionModel.countDocuments({ ...base, lateSubmission: true }),
      this.averageGrade({ institutionId: oid }),
      ProjectModel.aggregate([
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
            departmentId: '$_id',
            label: {
              $ifNull: [{ $arrayElemAt: ['$department.name', 0] }, 'Unassigned'],
            },
            count: 1,
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      ProjectModel.aggregate([
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
          $project: {
            courseId: '$courseId',
            courseCode: { $ifNull: [{ $arrayElemAt: ['$course.courseCode', 0] }, ''] },
            title: { $ifNull: [{ $arrayElemAt: ['$course.title', 0] }, 'Unknown'] },
            count: 1,
          },
        },
        { $group: { _id: '$courseId', courseCode: { $first: '$courseCode' }, title: { $first: '$title' }, count: { $sum: 1 } } },
        { $project: { courseId: '$_id', courseCode: 1, title: 1, count: 1 } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      ProjectModel.aggregate([
        { $match: base },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      ProjectModel.aggregate([
        { $match: base },
        { $group: { _id: '$projectType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    return {
      total,
      draft,
      published,
      closed,
      archived,
      totalTeams,
      totalSubmissions,
      gradedSubmissions,
      lateSubmissions,
      averageGrade,
      byDepartment: byDepartmentRaw as ProjectStats['byDepartment'],
      byCourse: byCourseRaw as ProjectStats['byCourse'],
      byStatus: byStatusRaw.map((row) => ({
        status: String(row._id),
        count: row.count as number,
      })),
      byType: byTypeRaw.map((row) => ({
        projectType: String(row._id),
        count: row.count as number,
      })),
    };
  }

  // --------------------------------------------------------------------- audit

  async listAudit(institutionId: string, projectId?: string, limit = 50) {
    const filter: Record<string, unknown> = { institutionId: toObjectId(institutionId) };
    if (projectId) filter.projectId = toObjectId(projectId);
    return ProjectAuditLogModel.find(filter).sort({ createdAt: -1 }).limit(limit).exec();
  }

  async logAudit(input: {
    event: ProjectAuditEvent;
    institutionId: string;
    projectId?: string | null;
    submissionId?: string | null;
    teamId?: string | null;
    milestoneId?: string | null;
    courseId?: string | null;
    studentId?: string | null;
    userId?: string | null;
    email?: string | null;
    metadata?: Record<string, unknown>;
  }) {
    return ProjectAuditLogModel.create({
      event: input.event,
      institutionId: toObjectId(input.institutionId),
      projectId: input.projectId ? toObjectId(input.projectId) : null,
      submissionId: input.submissionId ? toObjectId(input.submissionId) : null,
      teamId: input.teamId ? toObjectId(input.teamId) : null,
      milestoneId: input.milestoneId ? toObjectId(input.milestoneId) : null,
      courseId: input.courseId ? toObjectId(input.courseId) : null,
      studentId: input.studentId ? toObjectId(input.studentId) : null,
      userId: input.userId ? toObjectId(input.userId) : null,
      email: input.email ?? null,
      metadata: input.metadata ?? {},
    });
  }

  // --------------------------------------------------------------------- members

  async createMember(data: Record<string, unknown>): Promise<ProjectMemberDocument> {
    return ProjectMemberModel.create(data);
  }

  async findMemberById(
    institutionId: string,
    id: string,
  ): Promise<ProjectMemberDocument | null> {
    return ProjectMemberModel.findOne({
      _id: id,
      institutionId: toObjectId(institutionId),
      deletedAt: null,
    }).exec();
  }

  async findMemberByTeamAndStudent(
    institutionId: string,
    teamId: string,
    studentId: string,
  ): Promise<ProjectMemberDocument | null> {
    return ProjectMemberModel.findOne({
      institutionId: toObjectId(institutionId),
      teamId: toObjectId(teamId),
      studentId: toObjectId(studentId),
      deletedAt: null,
    }).exec();
  }

  async listMembersByTeam(
    institutionId: string,
    teamId: string,
  ): Promise<ProjectMemberDocument[]> {
    return ProjectMemberModel.find({
      institutionId: toObjectId(institutionId),
      teamId: toObjectId(teamId),
      deletedAt: null,
    }).exec();
  }

  async listMembersByStudent(
    institutionId: string,
    studentId: string,
  ): Promise<ProjectMemberDocument[]> {
    return ProjectMemberModel.find({
      institutionId: toObjectId(institutionId),
      studentId: toObjectId(studentId),
      invitationStatus: 'accepted',
      deletedAt: null,
    }).exec();
  }

  async updateMemberById(
    institutionId: string,
    id: string,
    data: Record<string, unknown>,
  ): Promise<ProjectMemberDocument | null> {
    return ProjectMemberModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId), deletedAt: null },
      { $set: data },
      { new: true },
    ).exec();
  }

  async softDeleteMember(
    institutionId: string,
    id: string,
  ): Promise<ProjectMemberDocument | null> {
    return ProjectMemberModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId), deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true },
    ).exec();
  }

  async countMembers(filter: Record<string, unknown>): Promise<number> {
    return ProjectMemberModel.countDocuments(filter).exec();
  }

  // -------------------------------------------------------------------- comments

  async listComments(
    institutionId: string,
    projectId: string,
    submissionId: string | null,
  ): Promise<ProjectCommentDocument[]> {
    const filter: Record<string, unknown> = {
      institutionId: toObjectId(institutionId),
      projectId: toObjectId(projectId),
      deletedAt: null,
    };
    if (submissionId) filter.submissionId = toObjectId(submissionId);
    return ProjectCommentModel.find(filter).sort({ createdAt: 1 }).exec();
  }

  async findCommentById(
    institutionId: string,
    id: string,
  ): Promise<ProjectCommentDocument | null> {
    return ProjectCommentModel.findOne({
      _id: id,
      institutionId: toObjectId(institutionId),
      deletedAt: null,
    }).exec();
  }

  async createComment(data: Record<string, unknown>): Promise<ProjectCommentDocument> {
    return ProjectCommentModel.create(data);
  }

  async updateCommentById(
    institutionId: string,
    id: string,
    data: Record<string, unknown>,
  ): Promise<ProjectCommentDocument | null> {
    return ProjectCommentModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId), deletedAt: null },
      { $set: data },
      { new: true },
    ).exec();
  }

  // ------------------------------------------------------------------------ tags

  async listTags(institutionId: string): Promise<ProjectTagDocument[]> {
    return ProjectTagModel.find({
      institutionId: toObjectId(institutionId),
      deletedAt: null,
    })
      .sort({ name: 1 })
      .exec();
  }

  async createTag(data: Record<string, unknown>): Promise<ProjectTagDocument> {
    return ProjectTagModel.create(data);
  }

  async findTagBySlug(institutionId: string, slug: string): Promise<ProjectTagDocument | null> {
    return ProjectTagModel.findOne({
      institutionId: toObjectId(institutionId),
      slug,
      deletedAt: null,
    }).exec();
  }

  // ------------------------------------------------------------------ categories

  async listCategories(institutionId: string): Promise<ProjectCategoryDocument[]> {
    return ProjectCategoryModel.find({
      institutionId: toObjectId(institutionId),
      deletedAt: null,
    })
      .sort({ name: 1 })
      .exec();
  }

  async createCategory(data: Record<string, unknown>): Promise<ProjectCategoryDocument> {
    return ProjectCategoryModel.create(data);
  }

  async findCategoryBySlug(
    institutionId: string,
    slug: string,
  ): Promise<ProjectCategoryDocument | null> {
    return ProjectCategoryModel.findOne({
      institutionId: toObjectId(institutionId),
      slug,
      deletedAt: null,
    }).exec();
  }
}

export const projectRepository = new ProjectRepository();
