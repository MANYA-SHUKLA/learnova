import { Types } from 'mongoose';
import { GRADEBOOK_DEFAULTS } from '@learnova/constants';
import {
  aggregateWeightedPercentage,
  letterGradeFromPercentage,
  sumMarks,
} from '@learnova/shared';
import type {
  AssignProjectGradeInput,
  FinalizeCourseGradesInput,
  GradebookListQuery,
  IngestGradebookSourceInput,
  SyncCourseGradebookInput,
  UpsertWeightSchemeInput,
} from '@learnova/validation';
import type {
  GradebookCourseDashboard,
  GradebookStudentDashboard,
  GradebookWeightScheme,
} from '@learnova/types';
import { CourseModel } from '../../models/course.model.js';
import { EnrollmentModel } from '../../models/enrollment.model.js';
import { FacultyModel } from '../../models/faculty.model.js';
import { ProjectGradeModel } from '../../models/project-grade.model.js';
import { ProjectSubmissionModel } from '../../models/project-submission.model.js';
import { ProjectModel } from '../../models/project.model.js';
import { StudentModel } from '../../models/student.model.js';
import { GradebookEntryModel } from '../../models/gradebook-entry.model.js';
import { CourseGradeSummaryModel } from '../../models/course-grade-summary.model.js';
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../utils/errors/index.js';
import { gradebookRepository } from '../../repositories/gradebook/gradebook.repository.js';
import {
  countPendingProjectSubmissions,
  ingestBySource,
  listCourseIngestDrafts,
} from './gradebook-ingestion.js';
import {
  ACTIVE_ENROLLMENT_STATUSES,
  kindWeightKey,
  oid,
  pageMeta,
  toDto,
} from './gradebook.helpers.js';

export interface ActorContext {
  userId: string;
  email: string;
  institutionId: string | null;
  role: string;
}

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

async function assertCourseAccess(
  actor: ActorContext,
  institutionId: string,
  courseId: string,
): Promise<void> {
  const course = await CourseModel.findOne({
    _id: courseId,
    institutionId: oid(institutionId),
    deletedAt: null,
  })
    .select('_id facultyIds coordinatorId')
    .lean()
    .exec();
  if (!course) throw new NotFoundError('Course not found');

  if (canManage(actor)) return;

  if (actor.role === 'faculty' || actor.role === 'teaching_assistant') {
    const faculty = await FacultyModel.findOne({
      institutionId: oid(institutionId),
      email: actor.email.toLowerCase(),
      deletedAt: null,
    })
      .select('_id')
      .lean()
      .exec();
    if (!faculty) throw new ForbiddenError('Faculty record not found');

    const facultyId = String(faculty._id);
    const facultyIds = (course.facultyIds ?? []).map(String);
    const coordinatorId = course.coordinatorId ? String(course.coordinatorId) : null;
    if (facultyIds.includes(facultyId) || coordinatorId === facultyId) return;
    throw new ForbiddenError('Not assigned to this course');
  }

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

    const enrollment = await EnrollmentModel.findOne({
      institutionId: oid(institutionId),
      courseId: oid(courseId),
      studentId: student._id,
      status: { $in: [...ACTIVE_ENROLLMENT_STATUSES] },
      deletedAt: null,
    }).exec();
    if (!enrollment) throw new ForbiddenError('Not enrolled in this course');
    return;
  }

  throw new ForbiddenError('Insufficient access to course gradebook');
}

async function resolveStudentScope(
  actor: ActorContext,
  institutionId: string,
  explicitStudentId?: string,
): Promise<string | undefined> {
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
    if (explicitStudentId && explicitStudentId !== String(student._id)) {
      throw new ForbiddenError('Students may only view their own grades');
    }
    return String(student._id);
  }
  return explicitStudentId;
}

function distributeWeightage(
  entries: Array<{ activityKind: string; _id: Types.ObjectId }>,
  scheme: {
    assignmentWeight: number;
    labWeight: number;
    quizWeight: number;
    examWeight: number;
    projectWeight: number;
  },
): Map<string, number> {
  const byKind = new Map<string, Types.ObjectId[]>();
  for (const entry of entries) {
    const list = byKind.get(entry.activityKind) ?? [];
    list.push(entry._id);
    byKind.set(entry.activityKind, list);
  }

  const weights = new Map<string, number>();
  for (const [kind, ids] of byKind.entries()) {
    const bucket = scheme[kindWeightKey(kind)] ?? 0;
    const each = ids.length > 0 ? bucket / ids.length : 0;
    for (const id of ids) {
      weights.set(String(id), Math.round(each * 100) / 100);
    }
  }
  return weights;
}

async function recomputeStudentSummary(
  institutionId: string,
  courseId: string,
  studentId: string,
) {
  const entries = await gradebookRepository.listEntriesForStudentCourse(
    institutionId,
    courseId,
    studentId,
  );
  const scheme =
    (await gradebookRepository.getWeightScheme(institutionId, courseId)) ??
    ({
      assignmentWeight: GRADEBOOK_DEFAULTS.ASSIGNMENT_WEIGHT,
      labWeight: GRADEBOOK_DEFAULTS.LAB_WEIGHT,
      quizWeight: GRADEBOOK_DEFAULTS.QUIZ_WEIGHT,
      examWeight: GRADEBOOK_DEFAULTS.EXAM_WEIGHT,
      projectWeight: GRADEBOOK_DEFAULTS.PROJECT_WEIGHT,
    } as const);

  const weightMap = distributeWeightage(entries, scheme);
  for (const entry of entries) {
    const weightage = weightMap.get(String(entry._id)) ?? 0;
    if (entry.weightage !== weightage) {
      entry.weightage = weightage;
      await entry.save();
    }
  }

  const rows = entries
    .filter((entry) => entry.status !== 'pending')
    .map((entry) => ({
      percentage: entry.percentage,
      weightage: entry.weightage,
      activityKind: entry.activityKind,
      marksObtained: entry.marksObtained,
      totalMarks: entry.totalMarks,
    }));

  const weightedPercentage = aggregateWeightedPercentage(rows);
  const marks = sumMarks(rows);
  const enrollmentId = entries[0]?.enrollmentId ?? null;

  return gradebookRepository.upsertSummary({
    institutionId: oid(institutionId),
    courseId: oid(courseId),
    studentId: oid(studentId),
    enrollmentId: enrollmentId as Types.ObjectId | null,
    weightedPercentage,
    letterGrade: letterGradeFromPercentage(weightedPercentage),
    totalMarksEarned: marks.earned,
    totalMarksPossible: marks.possible,
    entryCount: entries.length,
  });
}

export class GradebookService {
  async listEntries(query: GradebookListQuery, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const studentId = await resolveStudentScope(actor, institutionId, query.studentId);
    const scopedQuery = { ...query, studentId: studentId ?? query.studentId };

    if (scopedQuery.courseId) {
      await assertCourseAccess(actor, institutionId, scopedQuery.courseId);
    } else if (actor.role === 'student') {
      scopedQuery.studentId = studentId;
    }

    const result = await gradebookRepository.listEntries(institutionId, scopedQuery);
    return {
      items: result.items.map(toDto),
      meta: pageMeta(result.total, result.page, result.limit),
    };
  }

  async getCourseEntries(courseId: string, actor: ActorContext, studentId?: string) {
    const institutionId = requireTenant(actor);
    await assertCourseAccess(actor, institutionId, courseId);
    const scopedStudent = await resolveStudentScope(actor, institutionId, studentId);

    const query: GradebookListQuery = {
      courseId,
      studentId: scopedStudent,
      page: 1,
      limit: 100,
    };
    return this.listEntries(query, actor);
  }

  async getCourseSummaries(courseId: string, actor: ActorContext, studentId?: string) {
    const institutionId = requireTenant(actor);
    await assertCourseAccess(actor, institutionId, courseId);
    const scopedStudent = await resolveStudentScope(actor, institutionId, studentId);

    const summaries = await gradebookRepository.listSummariesForCourse(
      institutionId,
      courseId,
      scopedStudent,
    );
    return summaries.map(toDto);
  }

  async getWeightScheme(courseId: string, actor: ActorContext): Promise<GradebookWeightScheme> {
    const institutionId = requireTenant(actor);
    await assertCourseAccess(actor, institutionId, courseId);

    const scheme = await gradebookRepository.getWeightScheme(institutionId, courseId);
    if (!scheme) {
      return {
        id: '',
        institutionId,
        courseId,
        assignmentWeight: GRADEBOOK_DEFAULTS.ASSIGNMENT_WEIGHT,
        labWeight: GRADEBOOK_DEFAULTS.LAB_WEIGHT,
        quizWeight: GRADEBOOK_DEFAULTS.QUIZ_WEIGHT,
        examWeight: GRADEBOOK_DEFAULTS.EXAM_WEIGHT,
        projectWeight: GRADEBOOK_DEFAULTS.PROJECT_WEIGHT,
        attemptPolicy: GRADEBOOK_DEFAULTS.ATTEMPT_POLICY,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    return toDto(scheme) as unknown as GradebookWeightScheme;
  }

  async upsertWeightScheme(input: UpsertWeightSchemeInput, actor: ActorContext) {
    if (!canWrite(actor)) throw new ForbiddenError('Gradebook write access required');
    const institutionId = requireTenant(actor);
    await assertCourseAccess(actor, institutionId, input.courseId);

    const total =
      input.assignmentWeight +
      input.labWeight +
      input.quizWeight +
      input.examWeight +
      input.projectWeight;
    if (Math.abs(total - 100) > 0.01) {
      throw new ValidationError('Category weights must sum to 100');
    }

    const scheme = await gradebookRepository.upsertWeightScheme(
      institutionId,
      input.courseId,
      {
        assignmentWeight: input.assignmentWeight,
        labWeight: input.labWeight,
        quizWeight: input.quizWeight,
        examWeight: input.examWeight,
        projectWeight: input.projectWeight,
        attemptPolicy: input.attemptPolicy,
      },
      actor.userId,
    );

    await this.syncCourse({ courseId: input.courseId }, actor);
    return toDto(scheme);
  }

  async ingestSource(input: IngestGradebookSourceInput, actor: ActorContext) {
    if (!canWrite(actor)) throw new ForbiddenError('Gradebook write access required');
    const institutionId = requireTenant(actor);

    const draft = await ingestBySource(
      input.activityKind,
      input.sourceRefId,
      GRADEBOOK_DEFAULTS.ATTEMPT_POLICY,
    );
    if (!draft) throw new NotFoundError('Grade source not found or not releasable');

    if (String(draft.institutionId) !== institutionId) {
      throw new ForbiddenError('Source belongs to another institution');
    }

    await assertCourseAccess(actor, institutionId, String(draft.courseId));

    const scheme = await gradebookRepository.getWeightScheme(
      institutionId,
      String(draft.courseId),
    );
    const refinedDraft =
      input.activityKind === 'quiz'
        ? await ingestBySource(
            input.activityKind,
            input.sourceRefId,
            scheme?.attemptPolicy ?? GRADEBOOK_DEFAULTS.ATTEMPT_POLICY,
          )
        : draft;
    if (!refinedDraft) throw new NotFoundError('Grade source not found or not releasable');

    const entry = await gradebookRepository.upsertEntry(refinedDraft, 0);
    await recomputeStudentSummary(
      institutionId,
      String(refinedDraft.courseId),
      String(refinedDraft.studentId),
    );

    await gradebookRepository.appendAudit({
      institutionId,
      courseId: String(refinedDraft.courseId),
      studentId: String(refinedDraft.studentId),
      event: 'entry.ingested',
      actorId: actor.userId,
      details: { sourceRefId: input.sourceRefId, activityKind: input.activityKind },
    });

    return toDto(entry);
  }

  async syncCourse(input: SyncCourseGradebookInput, actor: ActorContext) {
    if (!canWrite(actor)) throw new ForbiddenError('Gradebook write access required');
    const institutionId = requireTenant(actor);
    await assertCourseAccess(actor, institutionId, input.courseId);

    const scheme =
      (await gradebookRepository.getWeightScheme(institutionId, input.courseId)) ?? null;
    const attemptPolicy = scheme?.attemptPolicy ?? GRADEBOOK_DEFAULTS.ATTEMPT_POLICY;

    const drafts = await listCourseIngestDrafts(institutionId, input.courseId, attemptPolicy);
    const studentIds = new Set<string>();

    for (const draft of drafts) {
      await gradebookRepository.upsertEntry(draft, 0);
      studentIds.add(String(draft.studentId));
    }

    for (const studentId of studentIds) {
      await recomputeStudentSummary(institutionId, input.courseId, studentId);
    }

    await gradebookRepository.appendAudit({
      institutionId,
      courseId: input.courseId,
      event: 'course.synced',
      actorId: actor.userId,
      details: { ingested: drafts.length, students: studentIds.size },
    });

    return {
      ingested: drafts.length,
      students: studentIds.size,
    };
  }

  async assignProjectGrade(input: AssignProjectGradeInput, actor: ActorContext) {
    if (!canWrite(actor)) throw new ForbiddenError('Gradebook write access required');
    const institutionId = requireTenant(actor);

    const submission = await ProjectSubmissionModel.findOne({
      _id: input.submissionId,
      institutionId: oid(institutionId),
      deletedAt: null,
    }).exec();
    if (!submission) throw new NotFoundError('Project submission not found');
    if (submission.evaluationStatus !== 'ready') {
      throw new ValidationError('Submission must be marked ready for gradebook export');
    }

    await assertCourseAccess(actor, institutionId, String(submission.courseId));

    const project = await ProjectModel.findOne({
      _id: submission.projectId,
      deletedAt: null,
    })
      .select('totalMarks passingMarks title')
      .lean()
      .exec();
    if (!project) throw new NotFoundError('Project not found');

    const totalMarks = input.totalMarks ?? project.totalMarks ?? 100;
    const passingMarks = input.passingMarks ?? project.passingMarks ?? 40;
    if (input.marksObtained > totalMarks) {
      throw new ValidationError('marksObtained cannot exceed totalMarks');
    }

    const percentage = totalMarks > 0 ? (input.marksObtained / totalMarks) * 100 : 0;
    const passed = input.marksObtained >= passingMarks;
    const studentId = submission.studentId as Types.ObjectId | null;
    if (!studentId) throw new ValidationError('Individual student submission required for grading');

    const grade = await ProjectGradeModel.findOneAndUpdate(
      { submissionId: submission._id, deletedAt: null },
      {
        $set: {
          institutionId: submission.institutionId,
          projectId: submission.projectId,
          submissionId: submission._id,
          studentId,
          teamId: submission.teamId,
          gradingMethod: input.gradingMethod,
          marksObtained: input.marksObtained,
          percentage: Math.round(percentage * 100) / 100,
          passed,
          feedback: input.feedback ?? null,
          preparedForGradebook: true,
          gradedBy: oid(actor.userId),
          gradedAt: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();

    submission.evaluationStatus = 'exported';
    submission.gradeId = grade._id;
    await submission.save();

    const draft = await ingestBySource('project', String(grade._id));
    if (!draft) throw new ValidationError('Failed to consume project grade');

    await gradebookRepository.upsertEntry(draft, 0);
    await recomputeStudentSummary(
      institutionId,
      String(submission.courseId),
      String(studentId),
    );

    await gradebookRepository.appendAudit({
      institutionId,
      courseId: String(submission.courseId),
      studentId: String(studentId),
      event: 'project.graded',
      actorId: actor.userId,
      details: { submissionId: input.submissionId, gradeId: String(grade._id) },
    });

    return { grade: toDto(grade), submissionId: String(submission._id) };
  }

  async finalizeCourse(input: FinalizeCourseGradesInput, actor: ActorContext) {
    if (!canManage(actor)) throw new ForbiddenError('Gradebook manage access required');
    const institutionId = requireTenant(actor);
    await assertCourseAccess(actor, institutionId, input.courseId);

    await this.syncCourse(input, actor);
    const summaries = await gradebookRepository.finalizeSummaries(
      institutionId,
      input.courseId,
      actor.userId,
    );

    await gradebookRepository.appendAudit({
      institutionId,
      courseId: input.courseId,
      event: 'summary.finalized',
      actorId: actor.userId,
      details: { count: summaries.length },
    });

    return { finalized: summaries.length, summaries: summaries.map(toDto) };
  }

  async institutionDashboard(courseId: string | undefined, actor: ActorContext) {
    if (!canManage(actor)) throw new ForbiddenError('Gradebook manage access required');
    const institutionId = requireTenant(actor);

    if (courseId) {
      await assertCourseAccess(actor, institutionId, courseId);
      const stats = await gradebookRepository.aggregateCourseStats(institutionId, courseId);
      const enrollmentCount = await EnrollmentModel.countDocuments({
        institutionId: oid(institutionId),
        courseId: oid(courseId),
        status: { $in: [...ACTIVE_ENROLLMENT_STATUSES] },
        deletedAt: null,
      }).exec();
      const pendingProjectGrades = await countPendingProjectSubmissions(institutionId, courseId);

      const dashboard: GradebookCourseDashboard = {
        courseId,
        enrollmentCount,
        entryCount: stats.entryCount,
        finalizedSummaries: stats.finalizedSummaries,
        pendingProjectGrades,
        averageWeightedPercentage: Math.round((stats.averageWeightedPercentage ?? 0) * 100) / 100,
      };
      return dashboard;
    }

    const courses = await CourseModel.find({ institutionId: oid(institutionId), deletedAt: null })
      .select('_id')
      .lean()
      .exec();

    let entryCount = 0;
    let finalizedSummaries = 0;
    let pendingProjectGrades = 0;
    let weightedSum = 0;
    let weightedCourses = 0;

    for (const course of courses) {
      const cid = String(course._id);
      const stats = await gradebookRepository.aggregateCourseStats(institutionId, cid);
      entryCount += stats.entryCount;
      finalizedSummaries += stats.finalizedSummaries;
      pendingProjectGrades += await countPendingProjectSubmissions(institutionId, cid);
      if (stats.averageWeightedPercentage != null) {
        weightedSum += stats.averageWeightedPercentage;
        weightedCourses += 1;
      }
    }

    return {
      courseCount: courses.length,
      entryCount,
      finalizedSummaries,
      pendingProjectGrades,
      averageWeightedPercentage:
        weightedCourses > 0 ? Math.round((weightedSum / weightedCourses) * 100) / 100 : 0,
    };
  }

  async facultyDashboard(courseId: string | undefined, actor: ActorContext) {
    if (!canWrite(actor)) throw new ForbiddenError('Gradebook read access required');
    const institutionId = requireTenant(actor);

    if (!courseId) throw new ValidationError('courseId is required for faculty dashboard');

    await assertCourseAccess(actor, institutionId, courseId);
    const stats = await gradebookRepository.aggregateCourseStats(institutionId, courseId);
    const pendingProjectGrades = await countPendingProjectSubmissions(institutionId, courseId);
    const enrollmentCount = await EnrollmentModel.countDocuments({
      institutionId: oid(institutionId),
      courseId: oid(courseId),
      status: { $in: [...ACTIVE_ENROLLMENT_STATUSES] },
      deletedAt: null,
    }).exec();

    return {
      courseId,
      enrollmentCount,
      entryCount: stats.entryCount,
      finalizedSummaries: stats.finalizedSummaries,
      pendingProjectGrades,
      averageWeightedPercentage: Math.round((stats.averageWeightedPercentage ?? 0) * 100) / 100,
    } satisfies GradebookCourseDashboard;
  }

  async studentDashboard(actor: ActorContext): Promise<GradebookStudentDashboard> {
    const institutionId = requireTenant(actor);
    const studentId = await resolveStudentScope(actor, institutionId);
    if (!studentId) throw new ForbiddenError('Student context required');

    const enrollments = await EnrollmentModel.find({
      institutionId: oid(institutionId),
      studentId: oid(studentId),
      status: { $in: [...ACTIVE_ENROLLMENT_STATUSES] },
      deletedAt: null,
    })
      .select('courseId')
      .lean()
      .exec();

    const summaries = await CourseGradeSummaryModel.find({
      institutionId: oid(institutionId),
      studentId: oid(studentId),
    })
      .lean()
      .exec();

    const finalizedCourses = summaries.filter((row) => row.status === 'finalized').length;
    const percentages = summaries
      .map((row) => row.weightedPercentage)
      .filter((value): value is number => value != null);
    const averagePercentage =
      percentages.length > 0
        ? Math.round((percentages.reduce((a, b) => a + b, 0) / percentages.length) * 100) / 100
        : 0;

    const recentEntries = await GradebookEntryModel.find({
      institutionId: oid(institutionId),
      studentId: oid(studentId),
      status: { $ne: 'superseded' },
    })
      .sort({ consumedAt: -1 })
      .limit(10)
      .exec();

    return {
      courseCount: enrollments.length,
      finalizedCourses,
      averagePercentage,
      recentEntries: recentEntries.map(toDto) as GradebookStudentDashboard['recentEntries'],
    };
  }

  async listPendingProjects(courseId: string, actor: ActorContext) {
    if (!canWrite(actor)) throw new ForbiddenError('Gradebook write access required');
    const institutionId = requireTenant(actor);
    await assertCourseAccess(actor, institutionId, courseId);

    const submissions = await ProjectSubmissionModel.find({
      institutionId: oid(institutionId),
      courseId: oid(courseId),
      evaluationStatus: 'ready',
      deletedAt: null,
    })
      .sort({ evaluationReadyAt: -1 })
      .limit(50)
      .lean()
      .exec();

    return submissions.map((row) => ({
      id: String(row._id),
      projectId: String(row.projectId),
      studentId: row.studentId ? String(row.studentId) : null,
      evaluationReadyAt: row.evaluationReadyAt?.toISOString() ?? null,
      attemptNumber: row.attemptNumber,
    }));
  }
}

export const gradebookService = new GradebookService();
