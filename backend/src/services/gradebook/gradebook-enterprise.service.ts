import { Types } from 'mongoose';
import { EVENTS } from '@learnova/events';
import {
  computeCgpa,
  computeGpaWithFormula,
  computeSemesterGpa,
  gradeDistribution,
} from '@learnova/shared';
import type {
  CreateGradeAppealInput,
  CreateGradeCommentInput,
  CreateTranscriptRequestInput,
  GradeReportQuery,
  GradebookBulkActionInput,
  LockCourseGradesInput,
  PublishCourseGradesInput,
  ResolveGradeAppealInput,
  ReviewTranscriptRequestInput,
  SemesterGradeQuery,
  UnlockCourseGradesInput,
} from '@learnova/validation';
import type { CourseGradebookMatrix, GradeReport } from '@learnova/types';
import { CourseModel } from '../../models/course.model.js';
import { EnrollmentModel } from '../../models/enrollment.model.js';
import { StudentModel } from '../../models/student.model.js';
import { CourseGradeSummaryModel } from '../../models/course-grade-summary.model.js';
import { GradebookEntryModel } from '../../models/gradebook-entry.model.js';
import { eventBus } from '../../events/index.js';
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../utils/errors/index.js';
import { gradebookRepository } from '../../repositories/gradebook/gradebook.repository.js';
import {
  ACTIVE_ENROLLMENT_STATUSES,
  oid,
  rowsToCsv,
  toDto,
} from './gradebook.helpers.js';
import type { ActorContext } from './gradebook.service.js';
import { gradebookService } from './gradebook.service.js';
import { loadInstitutionPolicy } from './gradebook-policies.helper.js';
import { policyConfigFromDoc } from './gradebook-policies.helper.js';

const MANAGE_ROLES = new Set(['institution_admin', 'super_admin']);
const WRITE_ROLES = new Set(['faculty', 'institution_admin', 'super_admin', 'teaching_assistant']);

function requireTenant(actor: ActorContext): string {
  if (!actor.institutionId) throw new ForbiddenError('Institution context required');
  return actor.institutionId;
}

function canManage(actor: ActorContext): boolean {
  return MANAGE_ROLES.has(actor.role);
}

function canWrite(actor: ActorContext): boolean {
  return WRITE_ROLES.has(actor.role);
}

async function emitGradeEvent(
  name: (typeof EVENTS)[keyof typeof EVENTS],
  payload: Record<string, unknown>,
  actorId: string,
) {
  await eventBus.emit(name, payload, { actorId });
}

async function recordChange(
  institutionId: string,
  summary: { _id: Types.ObjectId; courseId: Types.ObjectId; studentId: Types.ObjectId },
  field: string,
  oldValue: unknown,
  newValue: unknown,
  actor: ActorContext,
  reason?: string,
) {
  await gradebookRepository.recordHistory({
    institutionId,
    courseGradeId: String(summary._id),
    courseId: String(summary.courseId),
    studentId: String(summary.studentId),
    field,
    oldValue,
    newValue,
    reason,
    changedBy: actor.userId,
  });
}

export class GradebookEnterpriseService {
  async publishGrades(input: PublishCourseGradesInput, actor: ActorContext) {
    if (!canWrite(actor)) throw new ForbiddenError('Gradebook write access required');
    const institutionId = requireTenant(actor);
    await gradebookService.syncCourse({ courseId: input.courseId }, actor);

    const now = new Date();
    const summaries = await gradebookRepository.updateSummariesBulk(
      institutionId,
      input.courseId,
      input.studentIds,
      {
        published: true,
        publishedAt: now,
        status: 'published',
      },
    );

    for (const summary of summaries) {
      await recordChange(
        institutionId,
        summary,
        'published',
        false,
        true,
        actor,
        'Grades published to students',
      );
    }

    await gradebookRepository.appendAudit({
      institutionId,
      courseId: input.courseId,
      event: 'grade.published',
      actorId: actor.userId,
      details: { count: summaries.length },
    });
    await emitGradeEvent(EVENTS.GRADE_PUBLISHED, { courseId: input.courseId, count: summaries.length }, actor.userId);

    return { published: summaries.length, summaries: summaries.map(toDto) };
  }

  async lockGrades(input: LockCourseGradesInput, actor: ActorContext) {
    if (!canWrite(actor)) throw new ForbiddenError('Gradebook write access required');
    const institutionId = requireTenant(actor);
    const now = new Date();
    const summaries = await gradebookRepository.updateSummariesBulk(
      institutionId,
      input.courseId,
      input.studentIds,
      {
        locked: true,
        lockedAt: now,
        lockedBy: oid(actor.userId),
        status: 'faculty_review',
      },
    );

    for (const summary of summaries) {
      await recordChange(institutionId, summary, 'locked', false, true, actor, input.reason);
    }

    await gradebookRepository.appendAudit({
      institutionId,
      courseId: input.courseId,
      event: 'grade.locked',
      actorId: actor.userId,
      details: { count: summaries.length },
    });
    await emitGradeEvent(EVENTS.GRADE_LOCKED, { courseId: input.courseId, count: summaries.length }, actor.userId);
    await emitGradeEvent(EVENTS.GRADE_FROZEN, { courseId: input.courseId, count: summaries.length }, actor.userId);

    return { locked: summaries.length };
  }

  async unlockGrades(input: UnlockCourseGradesInput, actor: ActorContext) {
    if (!canManage(actor)) throw new ForbiddenError('Gradebook manage access required');
    const institutionId = requireTenant(actor);
    const summaries = await gradebookRepository.updateSummariesBulk(
      institutionId,
      input.courseId,
      input.studentIds,
      {
        locked: false,
        lockedAt: null,
        lockedBy: null,
        status: 'revision',
      },
    );

    for (const summary of summaries) {
      await recordChange(institutionId, summary, 'locked', true, false, actor, input.reason);
    }

    await gradebookRepository.appendAudit({
      institutionId,
      courseId: input.courseId,
      event: 'grade.unlocked',
      actorId: actor.userId,
      details: { count: summaries.length, reason: input.reason },
    });

    return { unlocked: summaries.length };
  }

  async bulkAction(input: GradebookBulkActionInput, actor: ActorContext) {
    switch (input.action) {
      case 'publish':
        return this.publishGrades(
          { courseId: input.courseId, studentIds: input.studentIds },
          actor,
        );
      case 'lock':
        return this.lockGrades({ courseId: input.courseId, studentIds: input.studentIds }, actor);
      case 'unlock':
        return this.unlockGrades(
          { courseId: input.courseId, studentIds: input.studentIds, reason: 'Bulk unlock' },
          actor,
        );
      case 'recalculate':
        return gradebookService.syncCourse({ courseId: input.courseId }, actor);
      case 'export':
        return this.generateReport(
          { type: 'course', courseId: input.courseId, format: 'csv' },
          actor,
        );
      default:
        throw new ValidationError('Unsupported bulk action');
    }
  }

  async createAppeal(input: CreateGradeAppealInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role !== 'student') throw new ForbiddenError('Students only');

    const summary = await CourseGradeSummaryModel.findOne({
      _id: input.courseGradeId,
      institutionId: oid(institutionId),
    }).exec();
    if (!summary) throw new NotFoundError('Course grade not found');
    if (!summary.published) throw new ValidationError('Grades must be published before appealing');

    const student = await StudentModel.findOne({
      institutionId: oid(institutionId),
      email: actor.email.toLowerCase(),
      deletedAt: null,
    }).exec();
    if (!student || String(summary.studentId) !== String(student._id)) {
      throw new ForbiddenError('You may only appeal your own grades');
    }

    const appeal = await gradebookRepository.createAppeal({
      institutionId,
      courseGradeId: input.courseGradeId,
      courseId: String(summary.courseId),
      studentId: String(summary.studentId),
      reason: input.reason,
    });

    await gradebookRepository.appendAudit({
      institutionId,
      courseId: String(summary.courseId),
      studentId: String(summary.studentId),
      event: 'appeal.created',
      actorId: actor.userId,
      details: { appealId: String(appeal._id) },
    });

    await emitGradeEvent(
      EVENTS.GRADE_APPEAL_CREATED,
      {
        appealId: String(appeal._id),
        courseGradeId: input.courseGradeId,
        studentId: String(summary.studentId),
      },
      actor.userId,
    );

    return toDto(appeal);
  }

  async resolveAppeal(input: ResolveGradeAppealInput, actor: ActorContext) {
    if (!canWrite(actor)) throw new ForbiddenError('Gradebook write access required');
    const institutionId = requireTenant(actor);
    const appeal = await gradebookRepository.resolveAppeal(
      institutionId,
      input.appealId,
      input.status,
      actor.userId,
      input.resolutionNotes,
    );
    if (!appeal) throw new NotFoundError('Appeal not found');

    await gradebookRepository.appendAudit({
      institutionId,
      courseId: String(appeal.courseId),
      studentId: String(appeal.studentId),
      event: 'appeal.resolved',
      actorId: actor.userId,
      details: { appealId: input.appealId, status: input.status },
    });

    await emitGradeEvent(
      EVENTS.GRADE_APPEAL_RESOLVED,
      {
        appealId: input.appealId,
        status: input.status,
        studentId: String(appeal.studentId),
      },
      actor.userId,
    );

    return toDto(appeal);
  }

  async listAppeals(
    actor: ActorContext,
    filters: { courseId?: string; studentId?: string; status?: string },
  ) {
    const institutionId = requireTenant(actor);
    const scopedStudent =
      actor.role === 'student'
        ? await StudentModel.findOne({
            institutionId: oid(institutionId),
            email: actor.email.toLowerCase(),
            deletedAt: null,
          }).then((s) => (s ? String(s._id) : undefined))
        : filters.studentId;

    if (actor.role === 'student' && !scopedStudent) throw new NotFoundError('Student not found');

    const items = await gradebookRepository.listAppeals(institutionId, {
      ...filters,
      studentId: scopedStudent,
    });
    return items.map(toDto);
  }

  async addComment(input: CreateGradeCommentInput, actor: ActorContext) {
    if (!canWrite(actor) && actor.role !== 'student') {
      throw new ForbiddenError('Gradebook write access required');
    }
    const institutionId = requireTenant(actor);
    const comment = await gradebookRepository.createComment({
      institutionId,
      courseGradeId: input.courseGradeId,
      gradebookEntryId: input.gradebookEntryId,
      courseId: input.courseId,
      studentId: input.studentId,
      authorId: actor.userId,
      visibility: input.visibility,
      body: input.body,
    });
    return toDto(comment);
  }

  async listComments(
    actor: ActorContext,
    filters: { courseId?: string; studentId?: string; courseGradeId?: string },
  ) {
    const institutionId = requireTenant(actor);
    const items = await gradebookRepository.listComments(institutionId, filters);
    const visible =
      actor.role === 'student'
        ? items.filter((c) => c.visibility === 'student')
        : actor.role === 'faculty'
          ? items.filter((c) => c.visibility !== 'internal' || canManage(actor))
          : items;
    return visible.map(toDto);
  }

  async listHistory(courseGradeId: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const items = await gradebookRepository.listHistory(institutionId, courseGradeId);
    return items.map(toDto);
  }

  async getCourseMatrix(courseId: string, actor: ActorContext): Promise<CourseGradebookMatrix> {
    const institutionId = requireTenant(actor);
    await gradebookService.getCourseEntries(courseId, actor);

    const enrollments = await EnrollmentModel.find({
      institutionId: oid(institutionId),
      courseId: oid(courseId),
      status: { $in: [...ACTIVE_ENROLLMENT_STATUSES] },
      deletedAt: null,
    })
      .select('studentId')
      .lean()
      .exec();

    const studentIds = enrollments.map((e) => String(e.studentId));
    const entries = await GradebookEntryModel.find({
      institutionId: oid(institutionId),
      courseId: oid(courseId),
      status: { $ne: 'superseded' },
    }).exec();
    const summaries = await CourseGradeSummaryModel.find({
      institutionId: oid(institutionId),
      courseId: oid(courseId),
    }).exec();

    const summaryMap = new Map(summaries.map((s) => [String(s.studentId), s]));
    const activityMap = new Map<string, { activityKind: string; activityId: string; title: string }>();

    for (const entry of entries) {
      const key = `${entry.activityKind}:${String(entry.activityId)}`;
      if (!activityMap.has(key)) {
        activityMap.set(key, {
          activityKind: entry.activityKind,
          activityId: String(entry.activityId),
          title: entry.activityTitle,
        });
      }
    }

    const students = studentIds.map((studentId) => ({
      studentId,
      summary: summaryMap.get(studentId) ? (toDto(summaryMap.get(studentId)!) as never) : null,
      entries: entries
        .filter((e) => String(e.studentId) === studentId)
        .map(toDto) as unknown as CourseGradebookMatrix['students'][0]['entries'],
    }));

    return {
      courseId,
      students,
      activityColumns: [...activityMap.values()] as CourseGradebookMatrix['activityColumns'],
    };
  }

  async recomputeSemesterGrades(query: SemesterGradeQuery, actor: ActorContext) {
    if (!canWrite(actor)) throw new ForbiddenError('Gradebook write access required');
    const institutionId = requireTenant(actor);
    const policyDoc = await loadInstitutionPolicy(institutionId);
    const policy = policyConfigFromDoc(policyDoc as Record<string, unknown> | null);

    const filter: Record<string, unknown> = { institutionId: oid(institutionId) };
    if (query.studentId) filter.studentId = oid(query.studentId);
    if (query.semesterId) filter.semesterId = oid(query.semesterId);

    const summaries = await CourseGradeSummaryModel.find({
      ...filter,
      published: true,
    }).exec();

    const bySemester = new Map<string, typeof summaries>();
    for (const summary of summaries) {
      if (!summary.semesterId) continue;
      const key = `${String(summary.studentId)}:${String(summary.semesterId)}`;
      const list = bySemester.get(key) ?? [];
      list.push(summary);
      bySemester.set(key, list);
    }

    const results = [];
    for (const [, rows] of bySemester.entries()) {
      const first = rows[0]!;
      const courseIds = rows.map((r) => r.courseId);
      const courses = await CourseModel.find({ _id: { $in: courseIds } })
        .select('credits')
        .lean()
        .exec();
      const creditMap = new Map(courses.map((c) => [String(c._id), c.credits ?? 0]));

      const semesterGpa = computeGpaWithFormula(
        rows.map((row) => ({
          gradePoints: row.gradePoints ?? null,
          credits: creditMap.get(String(row.courseId)) ?? 0,
        })),
        policy.gpaFormula,
      ) ?? computeSemesterGpa(
        rows.map((row) => ({
          gradePoints: row.gradePoints ?? null,
          credits: creditMap.get(String(row.courseId)) ?? 0,
        })),
      );
      const totalCredits = rows.reduce(
        (sum, row) => sum + (creditMap.get(String(row.courseId)) ?? 0),
        0,
      );

      const enrollment = await EnrollmentModel.findOne({
        studentId: first.studentId,
        semesterId: first.semesterId,
        institutionId: oid(institutionId),
      })
        .select('programId')
        .lean()
        .exec();

      const saved = await gradebookRepository.upsertSemesterGrade({
        institutionId: oid(institutionId),
        studentId: first.studentId as Types.ObjectId,
        semesterId: first.semesterId as Types.ObjectId,
        programId: (enrollment?.programId as Types.ObjectId | undefined) ?? null,
        semesterGpa,
        totalCredits,
        earnedCredits: totalCredits,
        courseCount: rows.length,
      });
      results.push(saved);
    }

    return { computed: results.length, items: results.map(toDto) };
  }

  async recomputeCgpa(studentId: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role === 'student') {
      const student = await StudentModel.findOne({
        institutionId: oid(institutionId),
        email: actor.email.toLowerCase(),
      }).exec();
      if (!student || String(student._id) !== studentId) {
        throw new ForbiddenError('Students may only view their own CGPA');
      }
    }

    const semesters = await gradebookRepository.listSemesterGrades(institutionId, studentId);
    const policyDoc = await loadInstitutionPolicy(institutionId);
    const policy = policyConfigFromDoc(policyDoc as Record<string, unknown> | null);
    const cgpa =
      computeGpaWithFormula(
        semesters.map((s) => ({
          gradePoints: s.semesterGpa ?? null,
          credits: s.totalCredits,
        })),
        policy.cgpaFormula,
      ) ??
      computeCgpa(
        semesters.map((s) => ({
          semesterGpa: s.semesterGpa ?? null,
          totalCredits: s.totalCredits,
        })),
      );
    const totalCredits = semesters.reduce((sum, s) => sum + s.totalCredits, 0);

    const enrollment = await EnrollmentModel.findOne({
      institutionId: oid(institutionId),
      studentId: oid(studentId),
      deletedAt: null,
    })
      .select('programId')
      .lean()
      .exec();

    const record = await gradebookRepository.upsertCgpaRecord({
      institutionId: oid(institutionId),
      studentId: oid(studentId),
      programId: (enrollment?.programId as Types.ObjectId | undefined) ?? null,
      cgpa,
      totalCredits,
      completedCredits: totalCredits,
    });

    return toDto(record);
  }

  async getSemesterGrades(query: SemesterGradeQuery, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    let studentId = query.studentId;
    if (actor.role === 'student') {
      const student = await StudentModel.findOne({
        institutionId: oid(institutionId),
        email: actor.email.toLowerCase(),
        deletedAt: null,
      }).exec();
      if (!student) throw new NotFoundError('Student not found');
      studentId = String(student._id);
    }
    const items = await gradebookRepository.listSemesterGrades(
      institutionId,
      studentId,
      query.semesterId,
    );
    return items.map(toDto);
  }

  async generateReport(query: GradeReportQuery, actor: ActorContext): Promise<GradeReport | { csv: string }> {
    const institutionId = requireTenant(actor);
    const filter: Record<string, unknown> = { institutionId: oid(institutionId) };
    if (query.courseId) filter.courseId = oid(query.courseId);
    if (query.studentId) filter.studentId = oid(query.studentId);
    if (query.semesterId) filter.semesterId = oid(query.semesterId);

    const summaries = await CourseGradeSummaryModel.find(filter).lean().exec();
    const rows = summaries.map((row) => ({
      studentId: String(row.studentId),
      courseId: String(row.courseId),
      percentage: row.percentage,
      letterGrade: row.letterGrade,
      gradePoints: row.gradePoints,
      result: row.result,
      status: row.status,
      locked: row.locked,
      published: row.published,
    }));

    const dist = gradeDistribution(
      summaries.map((row) => ({ letterGrade: row.letterGrade ?? null })),
    );
    const passCount = summaries.filter((row) => row.result === 'pass').length;
    const report: GradeReport = {
      type: query.type,
      generatedAt: new Date().toISOString(),
      filters: query as Record<string, unknown>,
      rows,
      summary: {
        total: summaries.length,
        passRate: summaries.length > 0 ? passCount / summaries.length : 0,
        gradeDistribution: dist,
        averagePercentage:
          summaries.length > 0
            ? summaries.reduce((sum, row) => sum + (row.percentage ?? 0), 0) / summaries.length
            : 0,
      },
    };

    if (query.format === 'csv') {
      const headers = [
        'studentId',
        'courseId',
        'percentage',
        'letterGrade',
        'gradePoints',
        'result',
        'status',
        'locked',
        'published',
      ];
      return { csv: rowsToCsv(headers, rows) };
    }

    return report;
  }

  async createTranscriptRequest(input: CreateTranscriptRequestInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role !== 'student') throw new ForbiddenError('Students only');

    const student = await StudentModel.findOne({
      institutionId: oid(institutionId),
      email: actor.email.toLowerCase(),
      deletedAt: null,
    }).exec();
    if (!student) throw new NotFoundError('Student record not found');

    const doc = await gradebookRepository.createTranscriptRequest({
      institutionId,
      studentId: String(student._id),
      semesterId: input.semesterId ?? null,
      requestType: input.requestType,
      reason: input.reason ?? null,
    });

    await gradebookRepository.appendAudit({
      institutionId,
      studentId: String(student._id),
      event: 'transcript.requested',
      actorId: actor.userId,
      details: { requestId: String(doc._id), requestType: input.requestType },
    });

    return toDto(doc);
  }

  async listTranscriptRequests(
    actor: ActorContext,
    filters: { status?: string; studentId?: string } = {},
  ) {
    const institutionId = requireTenant(actor);
    let studentId = filters.studentId;
    if (actor.role === 'student') {
      const student = await StudentModel.findOne({
        institutionId: oid(institutionId),
        email: actor.email.toLowerCase(),
        deletedAt: null,
      }).exec();
      if (!student) throw new NotFoundError('Student record not found');
      studentId = String(student._id);
    }
    const rows = await gradebookRepository.listTranscriptRequests(institutionId, {
      studentId,
      status: filters.status,
    });
    return rows.map(toDto);
  }

  async reviewTranscriptRequest(input: ReviewTranscriptRequestInput, actor: ActorContext) {
    if (!canWrite(actor)) throw new ForbiddenError('Gradebook write access required');
    const institutionId = requireTenant(actor);

    const updated = await gradebookRepository.reviewTranscriptRequest(
      institutionId,
      input.requestId,
      {
        status: input.status,
        reviewedBy: actor.userId,
        reviewNotes: input.reviewNotes ?? null,
      },
    );
    if (!updated) throw new NotFoundError('Transcript request not found');

    await gradebookRepository.appendAudit({
      institutionId,
      studentId: String(updated.studentId),
      event: 'transcript.reviewed',
      actorId: actor.userId,
      details: { requestId: input.requestId, status: input.status },
    });

    if (input.status === 'completed') {
      await emitGradeEvent(
        EVENTS.TRANSCRIPT_GENERATED,
        {
          requestId: input.requestId,
          studentId: String(updated.studentId),
          institutionId,
        },
        actor.userId,
      );
    }

    return toDto(updated);
  }

  async enhancedInstitutionDashboard(courseId: string | undefined, actor: ActorContext) {
    const base = await gradebookService.institutionDashboard(courseId, actor);
    const institutionId = requireTenant(actor);

    const filter: Record<string, unknown> = { institutionId: oid(institutionId) };
    if (courseId) filter.courseId = oid(courseId);

    const summaries = await CourseGradeSummaryModel.find(filter).lean().exec();
    const passCount = summaries.filter((row) => row.result === 'pass').length;
    const pendingAppeals = await gradebookRepository.countPendingAppeals(institutionId, courseId);

    return {
      ...base,
      pendingAppeals,
      passRate: summaries.length > 0 ? Math.round((passCount / summaries.length) * 10000) / 10000 : 0,
      gradeDistribution: gradeDistribution(
        summaries.map((row) => ({ letterGrade: row.letterGrade ?? null })),
      ),
    };
  }
}

export const gradebookEnterpriseService = new GradebookEnterpriseService();
