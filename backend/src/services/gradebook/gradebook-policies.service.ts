import { Types } from 'mongoose';
import { EVENTS } from '@learnova/events';
import {
  compareGradeSnapshots,
  computeAcademicStanding,
  DEFAULT_ACADEMIC_POLICY,
} from '@learnova/shared';
import type {
  CompareSnapshotsQuery,
  ComputeStandingInput,
  ModerationActionInput,
  UpsertAcademicPolicyInput,
} from '@learnova/validation';
import type { GradeVersionComparison } from '@learnova/types';
import { CourseGradeSummaryModel } from '../../models/course-grade-summary.model.js';
import { EnrollmentModel } from '../../models/enrollment.model.js';
import { StudentModel } from '../../models/student.model.js';
import { eventBus } from '../../events/index.js';
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../utils/errors/index.js';
import { gradebookRepository } from '../../repositories/gradebook/gradebook.repository.js';
import { oid, toDto } from './gradebook.helpers.js';
import type { ActorContext } from './gradebook.service.js';
import { gradebookService } from './gradebook.service.js';

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

async function assertCourseAccess(actor: ActorContext, _institutionId: string, courseId: string) {
  await gradebookService.getCourseSummaries(courseId, actor);
}

function snapshotFromSummary(
  summary: {
    percentage: number | null;
    letterGrade: string | null;
    gradePoints: number | null;
    result: string | null;
    finalMarks: number | null;
    totalMarksEarned: number;
    totalMarksPossible: number;
  },
  entries: Array<{
    activityKind: string;
    activityTitle: string;
    percentage: number | null;
    marksObtained: number | null;
    totalMarks: number | null;
    weightage: number;
    metadata?: Record<string, unknown>;
  }>,
  version: number,
  frozenAt: Date,
) {
  return {
    version,
    summary: {
      percentage: summary.percentage,
      letterGrade: summary.letterGrade,
      gradePoints: summary.gradePoints,
      result: summary.result,
      finalMarks: summary.finalMarks,
      totalMarksEarned: summary.totalMarksEarned,
      totalMarksPossible: summary.totalMarksPossible,
    },
    entries: entries.map((entry) => ({
      activityKind: entry.activityKind,
      activityTitle: entry.activityTitle,
      percentage: entry.percentage,
      marksObtained: entry.marksObtained,
      totalMarks: entry.totalMarks,
      weightage: entry.weightage,
      assessmentPurpose:
        (entry.metadata?.assessmentPurpose as string | undefined) ??
        (entry.metadata?.examType as string | undefined) ??
        'regular',
    })),
    frozenAt: frozenAt.toISOString(),
  };
}

export class GradebookPoliciesService {
  async getAcademicPolicy(actor: ActorContext) {
    requireTenant(actor);
    const institutionId = requireTenant(actor);
    const policy = await gradebookRepository.getAcademicPolicy(institutionId);
    if (!policy) {
      return {
        id: '',
        institutionId,
        ...DEFAULT_ACADEMIC_POLICY,
        improvementExamTypes: [],
        standingThresholds: {
          probationGpa: 1.5,
          warningGpa: 2.0,
          honorsGpa: 3.5,
          distinctionGpa: 3.8,
          failedCourseLimit: 2,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    return toDto(policy);
  }

  async upsertAcademicPolicy(input: UpsertAcademicPolicyInput, actor: ActorContext) {
    if (!canManage(actor)) throw new ForbiddenError('Gradebook manage access required');
    const institutionId = requireTenant(actor);

    const policy = await gradebookRepository.upsertAcademicPolicy(
      institutionId,
      {
        ...input,
        updatedBy: actor.userId,
      },
    );

    await gradebookRepository.appendAudit({
      institutionId,
      event: 'policy.updated',
      actorId: actor.userId,
      details: { passingCriteria: input.passingCriteria, gradingScheme: input.gradingScheme },
    });

    return toDto(policy);
  }

  async submitForReview(input: ModerationActionInput, actor: ActorContext) {
    if (!canWrite(actor)) throw new ForbiddenError('Gradebook write access required');
    const institutionId = requireTenant(actor);
    await assertCourseAccess(actor, institutionId, input.courseId);
    await gradebookService.syncCourse({ courseId: input.courseId }, actor);

    const now = new Date();
    const summaries = await gradebookRepository.updateSummariesBulk(
      institutionId,
      input.courseId,
      undefined,
      {
        moderationStage: 'faculty_submitted',
        facultySubmittedAt: now,
        facultySubmittedBy: oid(actor.userId),
        status: 'faculty_review',
      },
    );

    await gradebookRepository.createModerationRecords(
      summaries.map((summary) => ({
        institutionId,
        courseId: input.courseId,
        courseGradeId: String(summary._id),
        studentId: String(summary.studentId),
        stage: 'faculty_submitted' as const,
        actorId: actor.userId,
        actorRole: actor.role,
        notes: input.notes ?? null,
      })),
    );

    await gradebookRepository.appendAudit({
      institutionId,
      courseId: input.courseId,
      event: 'moderation.submitted',
      actorId: actor.userId,
      details: { count: summaries.length },
    });
    await eventBus.emit(
      EVENTS.GRADE_MODERATION_SUBMITTED,
      { courseId: input.courseId, count: summaries.length },
      { actorId: actor.userId },
    );

    return { submitted: summaries.length };
  }

  async approveDepartment(input: ModerationActionInput, actor: ActorContext) {
    if (!canManage(actor)) throw new ForbiddenError('Department approval requires manage access');
    const institutionId = requireTenant(actor);
    await assertCourseAccess(actor, institutionId, input.courseId);

    const pending = await CourseGradeSummaryModel.countDocuments({
      institutionId: oid(institutionId),
      courseId: oid(input.courseId),
      moderationStage: 'faculty_submitted',
    }).exec();
    if (pending === 0) {
      throw new ValidationError('No grades awaiting department review for this course');
    }

    const now = new Date();
    await CourseGradeSummaryModel.updateMany(
      {
        institutionId: oid(institutionId),
        courseId: oid(input.courseId),
        moderationStage: 'faculty_submitted',
      },
      {
        $set: {
          moderationStage: 'department_approved',
          departmentApprovedAt: now,
          departmentApprovedBy: oid(actor.userId),
        },
      },
    ).exec();

    const summaries = await CourseGradeSummaryModel.find({
      institutionId: oid(institutionId),
      courseId: oid(input.courseId),
      moderationStage: 'department_approved',
      departmentApprovedAt: now,
    }).exec();

    await gradebookRepository.createModerationRecords(
      summaries
        .filter((summary) => summary.moderationStage === 'department_approved')
        .map((summary) => ({
          institutionId,
          courseId: input.courseId,
          courseGradeId: String(summary._id),
          studentId: String(summary.studentId),
          stage: 'department_approved' as const,
          actorId: actor.userId,
          actorRole: actor.role,
          notes: input.notes ?? null,
        })),
    );

    await gradebookRepository.appendAudit({
      institutionId,
      courseId: input.courseId,
      event: 'moderation.department_approved',
      actorId: actor.userId,
      details: { count: summaries.length },
    });
    await eventBus.emit(
      EVENTS.GRADE_MODERATION_DEPARTMENT_APPROVED,
      { courseId: input.courseId, count: summaries.length },
      { actorId: actor.userId },
    );
    await eventBus.emit(
      EVENTS.GRADE_APPROVED,
      { courseId: input.courseId, institutionId, count: summaries.length },
      { actorId: actor.userId },
    );

    return { approved: summaries.length };
  }

  async publishWithSnapshots(input: ModerationActionInput, actor: ActorContext) {
    if (!canManage(actor)) throw new ForbiddenError('Institution publish requires manage access');
    const institutionId = requireTenant(actor);
    await assertCourseAccess(actor, institutionId, input.courseId);

    const summaries = await CourseGradeSummaryModel.find({
      institutionId: oid(institutionId),
      courseId: oid(input.courseId),
      moderationStage: 'department_approved',
    }).exec();

    if (summaries.length === 0) {
      throw new NotFoundError('No grade summaries found for publication');
    }

    const now = new Date();
    const snapshotsCreated: string[] = [];
    const studentIds = summaries.map((summary) => String(summary.studentId));
    const allEntries = await gradebookRepository.listEntriesForStudents(
      institutionId,
      input.courseId,
      studentIds,
    );
    const entriesByStudent = new Map<string, typeof allEntries>();
    for (const entry of allEntries) {
      const sid = String(entry.studentId);
      const bucket = entriesByStudent.get(sid) ?? [];
      bucket.push(entry);
      entriesByStudent.set(sid, bucket);
    }

    for (const summary of summaries) {
      const entries = entriesByStudent.get(String(summary.studentId)) ?? [];

      const nextVersion = (summary.snapshotVersion ?? 0) + 1;
      const snapshotData = snapshotFromSummary(
        {
          percentage: summary.percentage ?? null,
          letterGrade: summary.letterGrade ?? null,
          gradePoints: summary.gradePoints ?? null,
          result: summary.result ?? null,
          finalMarks: summary.finalMarks ?? null,
          totalMarksEarned: summary.totalMarksEarned,
          totalMarksPossible: summary.totalMarksPossible,
        },
        entries.map((entry) => ({
          activityKind: entry.activityKind,
          activityTitle: entry.activityTitle,
          percentage: entry.percentage ?? null,
          marksObtained: entry.marksObtained ?? null,
          totalMarks: entry.totalMarks ?? null,
          weightage: entry.weightage,
          metadata: (entry.metadata ?? undefined) as Record<string, unknown> | undefined,
        })),
        nextVersion,
        now,
      );

      const snapshot = await gradebookRepository.createSnapshot({
        institutionId,
        courseId: input.courseId,
        studentId: String(summary.studentId),
        courseGradeId: String(summary._id),
        version: nextVersion,
        summary: snapshotData.summary,
        entries: snapshotData.entries,
        frozenAt: now,
        frozenBy: actor.userId,
      });
      snapshotsCreated.push(String(snapshot._id));

      summary.snapshotVersion = nextVersion;
      summary.moderationStage = 'institution_published';
      summary.institutionPublishedAt = now;
      summary.institutionPublishedBy = oid(actor.userId);
      summary.published = true;
      summary.publishedAt = now;
      summary.status = 'published';
      summary.locked = true;
      summary.lockedAt = now;
      summary.lockedBy = oid(actor.userId);
      await summary.save();

      await gradebookRepository.createModerationRecord({
        institutionId,
        courseId: input.courseId,
        courseGradeId: String(summary._id),
        studentId: String(summary.studentId),
        stage: 'institution_published',
        actorId: actor.userId,
        actorRole: actor.role,
        notes: input.notes ?? null,
      });
    }

    await gradebookRepository.appendAudit({
      institutionId,
      courseId: input.courseId,
      event: 'moderation.published',
      actorId: actor.userId,
      details: { snapshots: snapshotsCreated.length },
    });
    await eventBus.emit(
      EVENTS.GRADE_SNAPSHOT_CREATED,
      { courseId: input.courseId, count: snapshotsCreated.length },
      { actorId: actor.userId },
    );
    await eventBus.emit(
      EVENTS.GRADE_PUBLISHED,
      { courseId: input.courseId, count: summaries.length },
      { actorId: actor.userId },
    );

    return { published: summaries.length, snapshots: snapshotsCreated.length };
  }

  async listModerationTimeline(courseId: string, actor: ActorContext, studentId?: string) {
    const institutionId = requireTenant(actor);
    await assertCourseAccess(actor, institutionId, courseId);
    const items = await gradebookRepository.listModerationRecords(institutionId, courseId, studentId);
    return items.map(toDto);
  }

  async listSnapshots(query: { courseId: string; studentId?: string }, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    await assertCourseAccess(actor, institutionId, query.courseId);
    const items = await gradebookRepository.listSnapshots(
      institutionId,
      query.courseId,
      query.studentId,
    );
    return items.map(toDto);
  }

  async compareSnapshots(query: CompareSnapshotsQuery, actor: ActorContext): Promise<GradeVersionComparison> {
    const institutionId = requireTenant(actor);
    await assertCourseAccess(actor, institutionId, query.courseId);

    const [fromSnap, toSnap] = await Promise.all([
      gradebookRepository.getSnapshot(
        institutionId,
        query.courseId,
        query.studentId,
        query.versionFrom,
      ),
      gradebookRepository.getSnapshot(
        institutionId,
        query.courseId,
        query.studentId,
        query.versionTo,
      ),
    ]);

    if (!fromSnap || !toSnap) {
      throw new NotFoundError('One or both snapshot versions were not found');
    }

    const diff = compareGradeSnapshots(
      {
        version: fromSnap.version,
        summary: fromSnap.summary as never,
        entries: fromSnap.entries as never,
        frozenAt: fromSnap.frozenAt.toISOString(),
      },
      {
        version: toSnap.version,
        summary: toSnap.summary as never,
        entries: toSnap.entries as never,
        frozenAt: toSnap.frozenAt.toISOString(),
      },
    );

    return {
      courseId: query.courseId,
      studentId: query.studentId,
      ...diff,
    };
  }

  async computeStanding(input: ComputeStandingInput, actor: ActorContext) {
    if (!canWrite(actor) && actor.role !== 'student') {
      throw new ForbiddenError('Gradebook write access required');
    }
    const institutionId = requireTenant(actor);
    const policyDoc = await gradebookRepository.getAcademicPolicy(institutionId);
    const thresholds =
      (policyDoc?.standingThresholds as {
        probationGpa: number;
        warningGpa: number;
        honorsGpa: number;
        distinctionGpa: number;
        failedCourseLimit: number;
      } | undefined) ?? {
        probationGpa: 1.5,
        warningGpa: 2.0,
        honorsGpa: 3.5,
        distinctionGpa: 3.8,
        failedCourseLimit: 2,
      };

    const filter: Record<string, unknown> = { institutionId: oid(institutionId), published: true };
    if (input.studentId) filter.studentId = oid(input.studentId);
    if (input.semesterId) filter.semesterId = oid(input.semesterId);

    const summaries = await CourseGradeSummaryModel.find(filter).exec();
    const groups = new Map<string, typeof summaries>();

    for (const summary of summaries) {
      const key = `${String(summary.studentId)}:${summary.semesterId ? String(summary.semesterId) : 'all'}`;
      const list = groups.get(key) ?? [];
      list.push(summary);
      groups.set(key, list);
    }

    const saved = [];
    for (const [key, rows] of groups.entries()) {
      const [studentId, semesterKey] = key.split(':');
      const semesterId = semesterKey === 'all' ? null : semesterKey;
      const failedCourseCount = rows.filter((row) => row.result === 'fail').length;
      const semesterRow = semesterId
        ? await gradebookRepository.listSemesterGrades(institutionId, studentId, semesterId)
        : await gradebookRepository.listSemesterGrades(institutionId, studentId);
      const cgpaRecord = await gradebookRepository.getCgpaRecord(institutionId, studentId!);

      const standing = computeAcademicStanding(
        {
          semesterGpa: semesterRow[0]?.semesterGpa ?? null,
          cgpa: cgpaRecord?.cgpa ?? null,
          failedCourseCount,
          publishedCourseCount: rows.length,
        },
        thresholds,
      );

      const enrollment = await EnrollmentModel.findOne({
        institutionId: oid(institutionId),
        studentId: oid(studentId!),
        deletedAt: null,
        ...(semesterId ? { semesterId: oid(semesterId) } : {}),
      })
        .select('programId')
        .lean()
        .exec();

      const record = await gradebookRepository.upsertAcademicStanding({
        institutionId: oid(institutionId),
        studentId: oid(studentId!),
        semesterId: semesterId ? oid(semesterId) : null,
        programId: (enrollment?.programId as Types.ObjectId | undefined) ?? null,
        standing,
        semesterGpa: semesterRow[0]?.semesterGpa ?? null,
        cgpa: cgpaRecord?.cgpa ?? null,
        failedCourseCount,
        publishedCourseCount: rows.length,
        computedAt: new Date(),
      });
      saved.push(record);
      await eventBus.emit(
        EVENTS.STANDING_UPDATED,
        {
          studentId: studentId!,
          institutionId,
          standing,
        },
        { actorId: actor.userId },
      );
    }

    await gradebookRepository.appendAudit({
      institutionId,
      event: 'standing.computed',
      actorId: actor.userId,
      details: { count: saved.length },
    });
    await eventBus.emit(
      EVENTS.GRADE_STANDING_COMPUTED,
      { count: saved.length },
      { actorId: actor.userId },
    );

    return { computed: saved.length, items: saved.map(toDto) };
  }

  async listStanding(actor: ActorContext, studentId?: string, semesterId?: string) {
    const institutionId = requireTenant(actor);
    let scopedStudent = studentId;
    if (actor.role === 'student') {
      const student = await StudentModel.findOne({
        institutionId: oid(institutionId),
        email: actor.email.toLowerCase(),
        deletedAt: null,
      })
        .select('_id')
        .lean()
        .exec();
      if (!student) throw new NotFoundError('Student record not found');
      scopedStudent = String(student._id);
    }
    const items = await gradebookRepository.listAcademicStandings(
      institutionId,
      scopedStudent,
      semesterId,
    );
    return items.map(toDto);
  }
}

export const gradebookPoliciesService = new GradebookPoliciesService();
