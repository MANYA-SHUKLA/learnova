import { Types } from 'mongoose';
import { EVENTS } from '@learnova/events';
import { GRADEBOOK_DEFAULTS } from '@learnova/constants';
import {
  aggregateWeightedPercentage,
  evaluatePassFail,
  gradePointsFromPercentage,
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
import { ProjectGradeModel } from '../../models/project-grade.model.js';
import { ProjectSubmissionModel } from '../../models/project-submission.model.js';
import { ProjectModel } from '../../models/project.model.js';
import { StudentModel } from '../../models/student.model.js';
import { GradebookEntryModel } from '../../models/gradebook-entry.model.js';
import { CourseGradeSummaryModel } from '../../models/course-grade-summary.model.js';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../utils/errors/index.js';
import { gradebookRepository } from '../../repositories/gradebook/gradebook.repository.js';
import { eventBus } from '../../events/index.js';
import {
  countPendingProjectSubmissions,
  ingestBySource,
  listCourseIngestDrafts,
} from './gradebook-ingestion.js';
import {
  ACTIVE_ENROLLMENT_STATUSES,
  distributeWeightage,
  oid,
  pageMeta,
  toDto,
} from './gradebook.helpers.js';
import { facultyCanAccessCourse } from '../access/faculty-scope.js';
import {
  applyRelativeLetterGrades,
  collapseExamEntriesForPolicy,
  loadInstitutionPolicy,
  policyConfigFromDoc,
} from './gradebook-policies.helper.js';

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
    const allowed = await facultyCanAccessCourse(institutionId, actor.email, courseId);
    if (!allowed) throw new ForbiddenError('Not assigned to this course');
    return;
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

async function recomputeStudentSummary(
  institutionId: string,
  courseId: string,
  studentId: string,
) {
  const existing = await gradebookRepository.getSummary(institutionId, courseId, studentId);
  if (existing?.locked) return existing;

  const policyDoc = await loadInstitutionPolicy(institutionId);
  const policy = policyConfigFromDoc(policyDoc as Record<string, unknown> | null);

  const entries = await gradebookRepository.listEntriesForStudentCourse(
    institutionId,
    courseId,
    studentId,
  );
  const schemeDoc = await gradebookRepository.getWeightScheme(institutionId, courseId);
  const scheme = schemeDoc ?? {
    assignmentWeight: GRADEBOOK_DEFAULTS.ASSIGNMENT_WEIGHT,
    labWeight: GRADEBOOK_DEFAULTS.LAB_WEIGHT,
    quizWeight: GRADEBOOK_DEFAULTS.QUIZ_WEIGHT,
    examWeight: GRADEBOOK_DEFAULTS.MIDTERM_WEIGHT + GRADEBOOK_DEFAULTS.FINAL_EXAM_WEIGHT,
    midtermWeight: GRADEBOOK_DEFAULTS.MIDTERM_WEIGHT,
    finalExamWeight: GRADEBOOK_DEFAULTS.FINAL_EXAM_WEIGHT,
    projectWeight: GRADEBOOK_DEFAULTS.PROJECT_WEIGHT,
    attendanceWeight: GRADEBOOK_DEFAULTS.ATTENDANCE_WEIGHT,
    extraCreditWeight: GRADEBOOK_DEFAULTS.EXTRA_CREDIT_WEIGHT,
  };

  const collapsedEntries = collapseExamEntriesForPolicy(
    entries.map((entry) => ({
      _id: entry._id,
      activityKind: entry.activityKind,
      activityId: entry.activityId as Types.ObjectId,
      activityTitle: entry.activityTitle,
      sourceRefId: entry.sourceRefId as Types.ObjectId,
      percentage: entry.percentage ?? null,
      marksObtained: entry.marksObtained ?? null,
      totalMarks: entry.totalMarks ?? null,
      weightage: entry.weightage,
      status: entry.status,
      consumedAt: entry.consumedAt as Date,
      metadata: entry.metadata as Record<string, unknown>,
    })),
    policy,
  );

  const collapsedIds = new Set(collapsedEntries.map((entry) => String(entry._id)));

  const weightMap = distributeWeightage(
    collapsedEntries.map((entry) => ({
      _id: entry._id,
      activityKind: entry.activityKind,
      metadata: entry.metadata,
    })),
    scheme as Record<string, number>,
  );
  for (const entry of entries) {
    const weightage = collapsedIds.has(String(entry._id))
      ? (weightMap.get(String(entry._id)) ?? 0)
      : 0;
    if (entry.weightage !== weightage) {
      entry.weightage = weightage;
      await entry.save();
    }
  }

  const rows = collapsedEntries
    .filter((entry) => entry.status !== 'pending')
    .map((entry) => ({
      percentage: entry.percentage,
      weightage: weightMap.get(String(entry._id)) ?? entry.weightage,
      activityKind: entry.activityKind,
      marksObtained: entry.marksObtained,
      totalMarks: entry.totalMarks,
    }));

  const weightedPercentage = aggregateWeightedPercentage(rows);
  const marks = sumMarks(rows);
  const enrollment = await EnrollmentModel.findOne({
    institutionId: oid(institutionId),
    courseId: oid(courseId),
    studentId: oid(studentId),
    deletedAt: null,
  })
    .select('_id semesterId facultyId programId')
    .lean()
    .exec();

  const letterGrade =
    policy.gradingScheme === 'relative'
      ? null
      : letterGradeFromPercentage(weightedPercentage);
  const gradePoints =
    policy.gradingScheme === 'relative' ? null : gradePointsFromPercentage(weightedPercentage);
  const passingMarks =
    marks.possible > 0
      ? (marks.possible * policy.passingPercentage) / 100
      : null;
  const result = evaluatePassFail(
    {
      percentage: weightedPercentage,
      letterGrade,
      marksObtained: marks.earned,
      totalMarks: marks.possible,
      passingMarks,
    },
    policy,
  );

  const summary = await gradebookRepository.upsertSummary({
    institutionId: oid(institutionId),
    courseId: oid(courseId),
    studentId: oid(studentId),
    enrollmentId: (enrollment?._id as Types.ObjectId | undefined) ?? null,
    semesterId: (enrollment?.semesterId as Types.ObjectId | undefined) ?? null,
    facultyId: (enrollment?.facultyId as Types.ObjectId | undefined) ?? null,
    weightedPercentage,
    finalMarks: marks.earned,
    percentage: weightedPercentage,
    letterGrade,
    gradePoints,
    result,
    totalMarksEarned: marks.earned,
    totalMarksPossible: marks.possible,
    entryCount: collapsedEntries.length,
  });

  await eventBus.emit(
    EVENTS.GRADE_CALCULATED,
    { courseId, studentId, institutionId },
  );

  return summary;
}

async function applyRelativeGradesForCourse(institutionId: string, courseId: string) {
  const policyDoc = await loadInstitutionPolicy(institutionId);
  const policy = policyConfigFromDoc(policyDoc as Record<string, unknown> | null);
  if (policy.gradingScheme !== 'relative') return;

  const summaries = await gradebookRepository.listSummariesForCourse(institutionId, courseId);
  const letterMap = applyRelativeLetterGrades(
    summaries.map((row) => ({
      studentId: String(row.studentId),
      weightedPercentage: row.weightedPercentage ?? null,
      letterGrade: row.letterGrade ?? null,
    })),
  );

  for (const summary of summaries) {
    const studentId = String(summary.studentId);
    const letterGrade = letterMap.get(studentId) ?? summary.letterGrade;
    const gradePoints = gradePointsFromPercentage(summary.weightedPercentage ?? null);
    const result = evaluatePassFail(
      {
        percentage: summary.weightedPercentage ?? null,
        letterGrade: letterGrade ?? null,
        marksObtained: summary.totalMarksEarned,
        totalMarks: summary.totalMarksPossible,
        passingMarks:
          summary.totalMarksPossible > 0
            ? (summary.totalMarksPossible * policy.passingPercentage) / 100
            : null,
      },
      policy,
    );

    summary.letterGrade = letterGrade;
    summary.gradePoints = gradePoints;
    summary.result = result;
    await summary.save();
  }
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
      sortBy: 'createdAt',
      sortOrder: 'desc',
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
    const filtered =
      actor.role === 'student'
        ? summaries.filter((row) => row.published)
        : summaries;
    return filtered.map(toDto);
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
        examWeight: GRADEBOOK_DEFAULTS.MIDTERM_WEIGHT + GRADEBOOK_DEFAULTS.FINAL_EXAM_WEIGHT,
        midtermWeight: GRADEBOOK_DEFAULTS.MIDTERM_WEIGHT,
        finalExamWeight: GRADEBOOK_DEFAULTS.FINAL_EXAM_WEIGHT,
        projectWeight: GRADEBOOK_DEFAULTS.PROJECT_WEIGHT,
        attendanceWeight: GRADEBOOK_DEFAULTS.ATTENDANCE_WEIGHT,
        extraCreditWeight: GRADEBOOK_DEFAULTS.EXTRA_CREDIT_WEIGHT,
        attemptPolicy: GRADEBOOK_DEFAULTS.ATTEMPT_POLICY,
        scaleId: null,
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

    const examWeight =
      input.examWeight ??
      input.midtermWeight + input.finalExamWeight;
    const total =
      input.assignmentWeight +
      input.labWeight +
      input.quizWeight +
      examWeight +
      input.projectWeight +
      input.attendanceWeight +
      input.extraCreditWeight;
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
        examWeight,
        midtermWeight: input.midtermWeight,
        finalExamWeight: input.finalExamWeight,
        projectWeight: input.projectWeight,
        attendanceWeight: input.attendanceWeight,
        extraCreditWeight: input.extraCreditWeight,
        attemptPolicy: input.attemptPolicy,
        scaleId: input.scaleId ?? null,
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

    if (
      await gradebookRepository.isStudentLocked(
        institutionId,
        String(refinedDraft.courseId),
        String(refinedDraft.studentId),
      )
    ) {
      throw new ConflictError('Grades are locked for this student');
    }

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
      if (
        await gradebookRepository.isStudentLocked(
          institutionId,
          input.courseId,
          String(draft.studentId),
        )
      ) {
        continue;
      }
      await gradebookRepository.upsertEntry(draft, 0);
      studentIds.add(String(draft.studentId));
    }

    for (const studentId of studentIds) {
      await recomputeStudentSummary(institutionId, input.courseId, studentId);
    }
    await applyRelativeGradesForCourse(institutionId, input.courseId);

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
      const pendingAppeals = await gradebookRepository.countPendingAppeals(institutionId, courseId);

      const dashboard: GradebookCourseDashboard = {
        courseId,
        enrollmentCount,
        entryCount: stats.entryCount,
        finalizedSummaries: stats.finalizedSummaries,
        publishedSummaries: stats.publishedSummaries ?? 0,
        lockedSummaries: stats.lockedSummaries ?? 0,
        pendingProjectGrades,
        pendingAppeals,
        averageWeightedPercentage: Math.round((stats.averageWeightedPercentage ?? 0) * 100) / 100,
      };
      return dashboard;
    }

    const stats = await gradebookRepository.aggregateInstitutionStats(institutionId);

    return {
      courseCount: stats.courseCount,
      entryCount: stats.entryCount,
      finalizedSummaries: stats.finalizedSummaries,
      pendingProjectGrades: stats.pendingProjectGrades,
      averageWeightedPercentage:
        Math.round((stats.averageWeightedPercentage ?? 0) * 100) / 100,
    };
  }

  async facultyDashboard(courseId: string | undefined, actor: ActorContext) {
    if (!canWrite(actor)) throw new ForbiddenError('Gradebook read access required');
    const institutionId = requireTenant(actor);

    if (!courseId) throw new ValidationError('courseId is required for faculty dashboard');

    await assertCourseAccess(actor, institutionId, courseId);
    const stats = await gradebookRepository.aggregateCourseStats(institutionId, courseId);
    const pendingProjectGrades = await countPendingProjectSubmissions(institutionId, courseId);
    const pendingAppeals = await gradebookRepository.countPendingAppeals(institutionId, courseId);
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
      publishedSummaries: stats.publishedSummaries ?? 0,
      lockedSummaries: stats.lockedSummaries ?? 0,
      pendingProjectGrades,
      pendingAppeals,
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

    const publishedSummaries = await CourseGradeSummaryModel.find({
      institutionId: oid(institutionId),
      studentId: oid(studentId),
      published: true,
    })
      .lean()
      .exec();

    const semesterRows = await gradebookRepository.listSemesterGrades(institutionId, studentId);
    const cgpaRecord = await gradebookRepository.getCgpaRecord(institutionId, studentId);
    const pendingAppeals = await gradebookRepository.countPendingAppeals(institutionId);

    const finalizedCourses = publishedSummaries.filter(
      (row) => row.status === 'published' || row.status === 'finalized',
    ).length;
    const percentages = publishedSummaries
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
      publishedCourses: publishedSummaries.length,
      averagePercentage,
      semesterGpa: semesterRows[0]?.semesterGpa ?? null,
      cgpa: cgpaRecord?.cgpa ?? null,
      pendingAppeals,
      recentEntries: recentEntries.map(toDto) as unknown as GradebookStudentDashboard['recentEntries'],
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
