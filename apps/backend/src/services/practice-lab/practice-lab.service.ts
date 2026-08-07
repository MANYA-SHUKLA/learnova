import { Types } from 'mongoose';
import { EVENTS } from '@learnova/events';
import {
  JUDGE0_LANGUAGE_IDS,
  PRACTICE_LANGUAGE_META,
  PRACTICE_LANGUAGES,
} from '@learnova/constants';
import type {
  CreateLabProblemInput,
  CreatePracticeLabInput,
  CreateTestCaseInput,
  DuplicateLabInput,
  ImportProblemsInput,
  LeaderboardQuery,
  PracticeLabListQuery,
  ProblemListQuery,
  RunCodeInput,
  SubmissionListQuery,
  SubmitSolutionInput,
  UpdateLabProblemInput,
  UpdatePracticeLabInput,
  UpdateTestCaseInput,
} from '@learnova/validation';
import type {
  ExecutionStatus,
  FacultyPracticeLabDashboard,
  LabProblem,
  LeaderboardEntry,
  PracticeLab,
  PracticeLabStats,
  PracticeLanguage,
  ProblemTestCase,
  StudentPracticeLabDashboard,
  StudentSubmission,
  ExecutionHistory as ExecutionHistoryDto,
  LabProgress as LabProgressDto,
} from '@learnova/types';
import { eventBus } from '../../events/index.js';
import { CourseModel } from '../../models/course.model.js';
import { EnrollmentModel } from '../../models/enrollment.model.js';
import { StudentModel } from '../../models/student.model.js';
import { UserModel } from '../../models/user.model.js';
import { LabProblemModel } from '../../models/lab-problem.model.js';
import { ProblemTestCaseModel } from '../../models/problem-test-case.model.js';
import { StudentCodeSubmissionModel } from '../../models/student-code-submission.model.js';
import { LabProgressModel } from '../../models/lab-progress.model.js';
import { PracticeLabModel } from '../../models/practice-lab.model.js';
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../utils/errors/index.js';
import { practiceLabRepository } from '../../repositories/practice-lab/index.js';
import { getSocketServer } from '../../socket/server-ref.js';
import {
  ACTIVE_ENROLLMENT_STATUSES,
  canTransitionStatus,
  computeSubmissionScore,
  defaultBoilerplates,
  evaluateAttempt,
  outputsMatch,
  pageMeta,
  PRACTICE_LAB_CSV_HEADERS,
  rowsToCsv,
  slugifyProblemTitle,
  toIso,
} from './practice-lab.helpers.js';
import {
  judge0Client,
  judge0IdForLanguage,
  mapJudge0StatusToExecutionStatus,
} from './judge0.client.js';

export interface ActorContext {
  userId: string;
  email: string;
  institutionId: string | null;
  role: string;
}

type DuplicateLabBody = DuplicateLabInput;
type ImportProblemsBody = ImportProblemsInput;

const MANAGE_ROLES = new Set(['institution_admin', 'super_admin']);

function requireTenant(actor: ActorContext): string {
  if (!actor.institutionId) throw new ForbiddenError('Institution context required');
  return actor.institutionId;
}

function canManage(actor: ActorContext): boolean {
  return MANAGE_ROLES.has(actor.role);
}

function emitPracticeStatus(room: string, payload: Record<string, unknown>) {
  try {
    const io = getSocketServer();
    io?.of('/practice').to(room).emit('execution.status', payload);
  } catch {
    // socket optional during tests / early boot
  }
}

function toLabDto(doc: {
  _id: { toString(): string };
  institutionId: { toString(): string };
  courseId: { toString(): string };
  moduleId?: { toString(): string } | null;
  lessonId?: { toString(): string } | null;
  title: string;
  description?: string | null;
  visibility: PracticeLab['visibility'];
  status: PracticeLab['status'];
  difficulty: PracticeLab['difficulty'];
  estimatedMinutes?: number | null;
  languages: PracticeLanguage[];
  allowRun: boolean;
  allowSubmit: boolean;
  maxSubmissions: number;
  problemCount?: number;
  createdBy?: { toString(): string } | null;
  updatedBy?: { toString(): string } | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}): PracticeLab {
  return {
    id: doc._id.toString(),
    institutionId: doc.institutionId.toString(),
    courseId: doc.courseId.toString(),
    moduleId: doc.moduleId ? doc.moduleId.toString() : null,
    lessonId: doc.lessonId ? doc.lessonId.toString() : null,
    title: doc.title,
    description: doc.description ?? null,
    visibility: doc.visibility,
    status: doc.status,
    difficulty: doc.difficulty,
    estimatedMinutes: doc.estimatedMinutes ?? null,
    languages: doc.languages as PracticeLanguage[],
    allowRun: doc.allowRun,
    allowSubmit: doc.allowSubmit,
    maxSubmissions: doc.maxSubmissions,
    problemCount: doc.problemCount ?? 0,
    createdBy: doc.createdBy ? doc.createdBy.toString() : null,
    updatedBy: doc.updatedBy ? doc.updatedBy.toString() : null,
    createdAt: toIso(doc.createdAt) ?? new Date().toISOString(),
    updatedAt: toIso(doc.updatedAt) ?? new Date().toISOString(),
    deletedAt: toIso(doc.deletedAt),
  };
}

function toProblemDto(
  doc: {
    _id: { toString(): string };
    institutionId: { toString(): string };
    practiceLabId: { toString(): string };
    title: string;
    slug: string;
    description?: string | null;
    problemStatement: string;
    inputFormat?: string | null;
    outputFormat?: string | null;
    constraints?: string | null;
    sampleInput?: string | null;
    sampleOutput?: string | null;
    explanation?: string | null;
    difficulty: LabProblem['difficulty'];
    tags?: string[];
    memoryLimitMB: number;
    timeLimitMS: number;
    allowedLanguages: PracticeLanguage[];
    boilerplates?: { language: PracticeLanguage; code: string }[];
    solutionCode?: string | null;
    editorial?: string | null;
    order?: number;
    createdBy?: { toString(): string } | null;
    updatedBy?: { toString(): string } | null;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
  },
  includePrivate: boolean,
): LabProblem {
  return {
    id: doc._id.toString(),
    institutionId: doc.institutionId.toString(),
    practiceLabId: doc.practiceLabId.toString(),
    title: doc.title,
    slug: doc.slug,
    description: doc.description ?? null,
    problemStatement: doc.problemStatement,
    inputFormat: doc.inputFormat ?? null,
    outputFormat: doc.outputFormat ?? null,
    constraints: doc.constraints ?? null,
    sampleInput: doc.sampleInput ?? null,
    sampleOutput: doc.sampleOutput ?? null,
    explanation: doc.explanation ?? null,
    difficulty: doc.difficulty,
    tags: doc.tags ?? [],
    memoryLimitMB: doc.memoryLimitMB,
    timeLimitMS: doc.timeLimitMS,
    allowedLanguages: doc.allowedLanguages as PracticeLanguage[],
    boilerplates: (doc.boilerplates ?? []) as LabProblem['boilerplates'],
    solutionCode: includePrivate ? (doc.solutionCode ?? null) : null,
    editorial: includePrivate ? (doc.editorial ?? null) : null,
    order: doc.order ?? 0,
    createdBy: doc.createdBy ? doc.createdBy.toString() : null,
    updatedBy: doc.updatedBy ? doc.updatedBy.toString() : null,
    createdAt: toIso(doc.createdAt) ?? new Date().toISOString(),
    updatedAt: toIso(doc.updatedAt) ?? new Date().toISOString(),
    deletedAt: toIso(doc.deletedAt),
  };
}

function toTestCaseDto(
  doc: {
    _id: { toString(): string };
    institutionId: { toString(): string };
    practiceLabId: { toString(): string };
    problemId: { toString(): string };
    input: string;
    expectedOutput: string;
    visibility: ProblemTestCase['visibility'];
    weight: number;
    timeoutMS?: number | null;
    memoryLimitMB?: number | null;
    order?: number;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
  },
  hideExpected: boolean,
): ProblemTestCase {
  return {
    id: doc._id.toString(),
    institutionId: doc.institutionId.toString(),
    practiceLabId: doc.practiceLabId.toString(),
    problemId: doc.problemId.toString(),
    input: hideExpected && doc.visibility === 'hidden' ? '' : doc.input,
    expectedOutput: hideExpected && doc.visibility === 'hidden' ? '' : doc.expectedOutput,
    visibility: doc.visibility,
    weight: doc.weight,
    timeoutMS: doc.timeoutMS ?? null,
    memoryLimitMB: doc.memoryLimitMB ?? null,
    order: doc.order ?? 0,
    createdAt: toIso(doc.createdAt) ?? new Date().toISOString(),
    updatedAt: toIso(doc.updatedAt) ?? new Date().toISOString(),
    deletedAt: toIso(doc.deletedAt),
  };
}

function toSubmissionDto(doc: {
  _id: { toString(): string };
  institutionId: { toString(): string };
  practiceLabId: { toString(): string };
  problemId: { toString(): string };
  studentId: { toString(): string };
  language: PracticeLanguage;
  sourceCode: string;
  verdict: StudentSubmission['verdict'];
  score: number;
  maxScore: number;
  passedCount: number;
  totalCount: number;
  attemptNumber: number;
  executionTimeMS?: number | null;
  memoryKB?: number | null;
  compileOutput?: string | null;
  results?: StudentSubmission['results'];
  judge0Token?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}): StudentSubmission {
  return {
    id: doc._id.toString(),
    institutionId: doc.institutionId.toString(),
    practiceLabId: doc.practiceLabId.toString(),
    problemId: doc.problemId.toString(),
    studentId: doc.studentId.toString(),
    language: doc.language,
    sourceCode: doc.sourceCode,
    verdict: doc.verdict,
    score: doc.score,
    maxScore: doc.maxScore,
    passedCount: doc.passedCount,
    totalCount: doc.totalCount,
    attemptNumber: doc.attemptNumber,
    executionTimeMS: doc.executionTimeMS ?? null,
    memoryKB: doc.memoryKB ?? null,
    compileOutput: doc.compileOutput ?? null,
    results: (doc.results ?? []).map((r) => ({
      ...r,
      testCaseId: String(r.testCaseId),
      expectedOutput:
        r.visibility === 'hidden' ? null : (r.expectedOutput ?? null),
      stdout: r.visibility === 'hidden' && !r.passed ? null : (r.stdout ?? null),
    })),
    judge0Token: doc.judge0Token ?? null,
    createdAt: toIso(doc.createdAt) ?? new Date().toISOString(),
    updatedAt: toIso(doc.updatedAt) ?? new Date().toISOString(),
  };
}

function toExecutionDto(doc: {
  _id: { toString(): string };
  institutionId: { toString(): string };
  practiceLabId?: { toString(): string } | null;
  problemId?: { toString(): string } | null;
  studentId: { toString(): string };
  language: PracticeLanguage;
  sourceCode: string;
  stdin?: string | null;
  stdout?: string | null;
  stderr?: string | null;
  compileOutput?: string | null;
  status: ExecutionStatus;
  exitCode?: number | null;
  executionTimeMS?: number | null;
  memoryKB?: number | null;
  submissionId?: { toString(): string } | null;
  isSubmission: boolean;
  judge0Token?: string | null;
  createdAt?: Date;
}): ExecutionHistoryDto {
  return {
    id: doc._id.toString(),
    institutionId: doc.institutionId.toString(),
    practiceLabId: doc.practiceLabId ? doc.practiceLabId.toString() : null,
    problemId: doc.problemId ? doc.problemId.toString() : null,
    studentId: doc.studentId.toString(),
    language: doc.language,
    sourceCode: doc.sourceCode,
    stdin: doc.stdin ?? null,
    stdout: doc.stdout ?? null,
    stderr: doc.stderr ?? null,
    compileOutput: doc.compileOutput ?? null,
    status: doc.status,
    exitCode: doc.exitCode ?? null,
    executionTimeMS: doc.executionTimeMS ?? null,
    memoryKB: doc.memoryKB ?? null,
    submissionId: doc.submissionId ? doc.submissionId.toString() : null,
    isSubmission: doc.isSubmission,
    judge0Token: doc.judge0Token ?? null,
    createdAt: toIso(doc.createdAt) ?? new Date().toISOString(),
  };
}

class PracticeLabService {
  private async audit(
    event: Parameters<typeof practiceLabRepository.logAudit>[0]['event'],
    actor: ActorContext,
    meta: Omit<Parameters<typeof practiceLabRepository.logAudit>[0], 'event' | 'userId' | 'email' | 'institutionId'> & {
      institutionId: string;
    },
  ) {
    await practiceLabRepository.logAudit({
      ...meta,
      event,
      userId: actor.userId,
      email: actor.email,
    });
  }

  private async resolveStudentId(actor: ActorContext): Promise<string> {
    const institutionId = requireTenant(actor);
    const student = await StudentModel.findOne({
      userId: actor.userId,
      institutionId,
      deletedAt: null,
    })
      .select('_id')
      .lean();
    if (!student) throw new ForbiddenError('Student profile required');
    return String(student._id);
  }

  private async assertCourseAccess(courseId: string, institutionId: string) {
    const course = await CourseModel.findOne({
      _id: courseId,
      institutionId,
      deletedAt: null,
    })
      .select('_id')
      .lean();
    if (!course) throw new NotFoundError('Course not found');
  }

  private async assertLabWrite(lab: { createdBy?: { toString(): string } | null }, actor: ActorContext) {
    if (canManage(actor)) return;
    if (actor.role === 'faculty' && lab.createdBy?.toString() === actor.userId) return;
    if (actor.role === 'faculty') {
      // faculty can write own labs only
      throw new ForbiddenError('You can only manage your own practice labs');
    }
    throw new ForbiddenError('Insufficient permissions');
  }

  private async assertStudentEnrolled(studentId: string, courseId: string, institutionId: string) {
    const enrollment = await EnrollmentModel.findOne({
      institutionId,
      studentId,
      courseId,
      status: { $in: [...ACTIVE_ENROLLMENT_STATUSES] },
      deletedAt: null,
    })
      .select('_id')
      .lean();
    if (!enrollment) throw new ForbiddenError('Active enrollment required');
  }

  private async scopeLabFilter(
    filter: Record<string, unknown>,
    actor: ActorContext,
  ): Promise<Record<string, unknown>> {
    if (canManage(actor)) return filter;
    if (actor.role === 'faculty') {
      return { ...filter, createdBy: new Types.ObjectId(actor.userId) };
    }
    if (actor.role === 'student') {
      const studentId = await this.resolveStudentId(actor);
      const enrollments = await EnrollmentModel.find({
        institutionId: filter.institutionId,
        studentId,
        status: { $in: [...ACTIVE_ENROLLMENT_STATUSES] },
        deletedAt: null,
      })
        .select('courseId')
        .lean();
      const courseIds = enrollments.map((e) => e.courseId);
      return {
        ...filter,
        status: 'published',
        courseId: filter.courseId ?? { $in: courseIds },
      };
    }
    return filter;
  }

  async list(query: PracticeLabListQuery, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    let filter = practiceLabRepository.buildLabFilter(institutionId, query);
    filter = await this.scopeLabFilter(filter, actor);
    const result = await practiceLabRepository.listLabs(filter, query);
    return {
      items: result.items.map(toLabDto),
      meta: pageMeta(result.total, result.page, result.limit),
    };
  }

  async search(query: PracticeLabListQuery, actor: ActorContext) {
    return this.list(query, actor);
  }

  async get(id: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const lab = await practiceLabRepository.findLabById(institutionId, id);
    if (!lab) throw new NotFoundError('Practice lab not found');
    if (actor.role === 'student' && lab.status !== 'published') {
      throw new ForbiddenError('Practice lab is not published');
    }
    if (actor.role === 'faculty' && !canManage(actor)) {
      // faculty can view published or own
      if (lab.status !== 'published' && lab.createdBy?.toString() !== actor.userId) {
        throw new ForbiddenError('Practice lab not accessible');
      }
    }
    return toLabDto(lab);
  }

  async create(input: CreatePracticeLabInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role === 'student') throw new ForbiddenError('Students cannot create labs');
    await this.assertCourseAccess(input.courseId, institutionId);

    const doc = await practiceLabRepository.createLab({
      institutionId,
      courseId: input.courseId,
      moduleId: input.moduleId ?? null,
      lessonId: input.lessonId ?? null,
      title: input.title,
      description: input.description ?? null,
      visibility: input.visibility ?? 'enrolled',
      status: 'draft',
      difficulty: input.difficulty ?? 'medium',
      estimatedMinutes: input.estimatedMinutes ?? null,
      languages: input.languages ?? ['python', 'javascript'],
      allowRun: input.allowRun ?? true,
      allowSubmit: input.allowSubmit ?? true,
      maxSubmissions: input.maxSubmissions ?? 50,
      problemCount: 0,
      createdBy: actor.userId,
      updatedBy: actor.userId,
    });

    await this.audit('practice_created', actor, {
      institutionId,
      practiceLabId: String(doc._id),
      courseId: input.courseId,
    });
    eventBus.emit(EVENTS.PRACTICE_CREATED, {
      practiceLabId: String(doc._id),
      courseId: input.courseId,
      institutionId,
    });

    return toLabDto(doc);
  }

  async update(id: string, input: UpdatePracticeLabInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const lab = await practiceLabRepository.findLabById(institutionId, id);
    if (!lab) throw new NotFoundError('Practice lab not found');
    await this.assertLabWrite(lab, actor);

    const updated = await practiceLabRepository.updateLab(institutionId, id, {
      ...input,
      updatedBy: actor.userId,
    });
    if (!updated) throw new NotFoundError('Practice lab not found');
    await this.audit('practice_updated', actor, {
      institutionId,
      practiceLabId: id,
      courseId: String(lab.courseId),
    });
    return toLabDto(updated);
  }

  async remove(id: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const lab = await practiceLabRepository.findLabById(institutionId, id);
    if (!lab) throw new NotFoundError('Practice lab not found');
    await this.assertLabWrite(lab, actor);
    await practiceLabRepository.softDeleteLab(institutionId, id, actor.userId);
    await this.audit('practice_deleted', actor, {
      institutionId,
      practiceLabId: id,
      courseId: String(lab.courseId),
    });
    return { id };
  }

  async publish(id: string, actor: ActorContext) {
    return this.transition(id, 'published', actor, 'practice_published');
  }

  async archive(id: string, actor: ActorContext) {
    return this.transition(id, 'archived', actor, 'practice_archived');
  }

  async restore(id: string, actor: ActorContext) {
    return this.transition(id, 'draft', actor, 'practice_restored');
  }

  async close(id: string, actor: ActorContext) {
    return this.transition(id, 'closed', actor, 'practice_archived');
  }

  private async transition(
    id: string,
    to: PracticeLab['status'],
    actor: ActorContext,
    auditEvent: Parameters<typeof practiceLabRepository.logAudit>[0]['event'],
  ) {
    const institutionId = requireTenant(actor);
    const lab = await practiceLabRepository.findLabById(institutionId, id);
    if (!lab) throw new NotFoundError('Practice lab not found');
    await this.assertLabWrite(lab, actor);
    if (!canTransitionStatus(lab.status as PracticeLab['status'], to)) {
      throw new ValidationError(`Cannot transition from ${lab.status} to ${to}`);
    }
    const updated = await practiceLabRepository.updateLab(institutionId, id, {
      status: to,
      updatedBy: actor.userId,
    });
    await this.audit(auditEvent, actor, {
      institutionId,
      practiceLabId: id,
      courseId: String(lab.courseId),
      metadata: { from: lab.status, to },
    });
    return toLabDto(updated!);
  }

  async duplicate(id: string, input: DuplicateLabBody, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const lab = await practiceLabRepository.findLabById(institutionId, id);
    if (!lab) throw new NotFoundError('Practice lab not found');
    await this.assertLabWrite(lab, actor);

    const courseId = input.courseId ?? String(lab.courseId);
    await this.assertCourseAccess(courseId, institutionId);

    const clone = await practiceLabRepository.createLab({
      institutionId,
      courseId,
      moduleId: lab.moduleId,
      lessonId: lab.lessonId,
      title: input.title ?? `${lab.title} (Copy)`,
      description: lab.description,
      visibility: lab.visibility,
      status: 'draft',
      difficulty: lab.difficulty,
      estimatedMinutes: lab.estimatedMinutes,
      languages: lab.languages,
      allowRun: lab.allowRun,
      allowSubmit: lab.allowSubmit,
      maxSubmissions: lab.maxSubmissions,
      problemCount: 0,
      createdBy: actor.userId,
      updatedBy: actor.userId,
    });

    const problems = await LabProblemModel.find({
      practiceLabId: lab._id,
      deletedAt: null,
    }).exec();

    for (const problem of problems) {
      const created = await practiceLabRepository.createProblem({
        institutionId,
        practiceLabId: clone._id,
        title: problem.title,
        slug: `${problem.slug}-${String(clone._id).slice(-6)}`,
        description: problem.description,
        problemStatement: problem.problemStatement,
        inputFormat: problem.inputFormat,
        outputFormat: problem.outputFormat,
        constraints: problem.constraints,
        sampleInput: problem.sampleInput,
        sampleOutput: problem.sampleOutput,
        explanation: problem.explanation,
        difficulty: problem.difficulty,
        tags: problem.tags,
        memoryLimitMB: problem.memoryLimitMB,
        timeLimitMS: problem.timeLimitMS,
        allowedLanguages: problem.allowedLanguages,
        boilerplates: problem.boilerplates,
        solutionCode: problem.solutionCode,
        editorial: problem.editorial,
        order: problem.order,
        createdBy: actor.userId,
        updatedBy: actor.userId,
      });

      const cases = await ProblemTestCaseModel.find({
        problemId: problem._id,
        deletedAt: null,
      }).lean();
      if (cases.length) {
        await practiceLabRepository.createTestCases(
          cases.map((c) => ({
            institutionId,
            practiceLabId: clone._id,
            problemId: created._id,
            input: c.input,
            expectedOutput: c.expectedOutput,
            visibility: c.visibility,
            weight: c.weight,
            timeoutMS: c.timeoutMS,
            memoryLimitMB: c.memoryLimitMB,
            order: c.order,
          })),
        );
      }
    }

    await practiceLabRepository.updateLab(institutionId, String(clone._id), {
      problemCount: problems.length,
    });

    await this.audit('practice_duplicated', actor, {
      institutionId,
      practiceLabId: String(clone._id),
      courseId,
      metadata: { sourceLabId: id },
    });

    return toLabDto(clone);
  }

  async exportLabs(query: { courseId?: string; status?: string; format?: string }, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const filter = practiceLabRepository.buildLabFilter(institutionId, query as PracticeLabListQuery);
    const result = await practiceLabRepository.listLabs(filter, {
      page: 1,
      limit: 1000,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    await this.audit('lab_exported', actor, { institutionId, metadata: { count: result.total } });

    if (query.format === 'csv') {
      const rows = result.items.map((lab) => ({
        id: String(lab._id),
        courseId: String(lab.courseId),
        title: lab.title,
        difficulty: lab.difficulty,
        status: lab.status,
        languages: (lab.languages ?? []).join('|'),
        problemCount: lab.problemCount ?? 0,
        createdAt: toIso(lab.createdAt),
      }));
      return { format: 'csv' as const, content: rowsToCsv(rows, PRACTICE_LAB_CSV_HEADERS) };
    }

    return {
      format: 'json' as const,
      content: result.items.map(toLabDto),
    };
  }

  // ------------------------------------------------------------------ problems

  async listProblems(query: ProblemListQuery, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const filter = practiceLabRepository.buildProblemFilter(institutionId, query);
    const result = await practiceLabRepository.listProblems(filter, query);
    const includePrivate = actor.role !== 'student';
    let items = result.items.map((p) => toProblemDto(p, includePrivate));

    if (actor.role === 'student' && query.solved !== undefined) {
      const studentId = await this.resolveStudentId(actor);
      const accepted = await practiceLabRepository.acceptedProblemIds(
        studentId,
        items.map((i) => i.id),
      );
      items = items.filter((i) => (query.solved ? accepted.has(i.id) : !accepted.has(i.id)));
    }

    return { items, meta: pageMeta(result.total, result.page, result.limit) };
  }

  async getProblem(id: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const problem = await practiceLabRepository.findProblemById(institutionId, id);
    if (!problem) throw new NotFoundError('Problem not found');
    const lab = await practiceLabRepository.findLabById(institutionId, String(problem.practiceLabId));
    if (!lab) throw new NotFoundError('Practice lab not found');
    if (actor.role === 'student' && lab.status !== 'published') {
      throw new ForbiddenError('Practice lab is not published');
    }
    return toProblemDto(problem, actor.role !== 'student');
  }

  async createProblem(input: CreateLabProblemInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const lab = await practiceLabRepository.findLabById(institutionId, input.practiceLabId);
    if (!lab) throw new NotFoundError('Practice lab not found');
    await this.assertLabWrite(lab, actor);

    const languages =
      input.allowedLanguages ?? (lab.languages as PracticeLanguage[]) ?? ['python'];
    const slug = input.slug ?? slugifyProblemTitle(input.title);

    const doc = await practiceLabRepository.createProblem({
      institutionId,
      practiceLabId: input.practiceLabId,
      title: input.title,
      slug,
      description: input.description ?? null,
      problemStatement: input.problemStatement,
      inputFormat: input.inputFormat ?? null,
      outputFormat: input.outputFormat ?? null,
      constraints: input.constraints ?? null,
      sampleInput: input.sampleInput ?? null,
      sampleOutput: input.sampleOutput ?? null,
      explanation: input.explanation ?? null,
      difficulty: input.difficulty ?? 'medium',
      tags: input.tags ?? [],
      memoryLimitMB: input.memoryLimitMB ?? 256,
      timeLimitMS: input.timeLimitMS ?? 2000,
      allowedLanguages: languages,
      boilerplates:
        input.boilerplates?.length ? input.boilerplates : defaultBoilerplates(languages),
      solutionCode: input.solutionCode ?? null,
      editorial: input.editorial ?? null,
      order: input.order ?? lab.problemCount ?? 0,
      createdBy: actor.userId,
      updatedBy: actor.userId,
    });

    await practiceLabRepository.incrementProblemCount(input.practiceLabId, 1);
    await this.audit('problem_created', actor, {
      institutionId,
      practiceLabId: input.practiceLabId,
      problemId: String(doc._id),
      courseId: String(lab.courseId),
    });
    eventBus.emit(EVENTS.PROBLEM_CREATED, {
      problemId: String(doc._id),
      practiceLabId: input.practiceLabId,
      institutionId,
    });

    return toProblemDto(doc, true);
  }

  async updateProblem(id: string, input: UpdateLabProblemInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const problem = await practiceLabRepository.findProblemById(institutionId, id);
    if (!problem) throw new NotFoundError('Problem not found');
    const lab = await practiceLabRepository.findLabById(institutionId, String(problem.practiceLabId));
    if (!lab) throw new NotFoundError('Practice lab not found');
    await this.assertLabWrite(lab, actor);

    const updated = await practiceLabRepository.updateProblem(institutionId, id, {
      ...input,
      updatedBy: actor.userId,
    });
    await this.audit('problem_updated', actor, {
      institutionId,
      practiceLabId: String(problem.practiceLabId),
      problemId: id,
    });
    return toProblemDto(updated!, true);
  }

  async removeProblem(id: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const problem = await practiceLabRepository.findProblemById(institutionId, id);
    if (!problem) throw new NotFoundError('Problem not found');
    const lab = await practiceLabRepository.findLabById(institutionId, String(problem.practiceLabId));
    if (!lab) throw new NotFoundError('Practice lab not found');
    await this.assertLabWrite(lab, actor);
    await practiceLabRepository.softDeleteProblem(institutionId, id, actor.userId);
    await practiceLabRepository.incrementProblemCount(String(problem.practiceLabId), -1);
    await this.audit('problem_deleted', actor, {
      institutionId,
      practiceLabId: String(problem.practiceLabId),
      problemId: id,
    });
    return { id };
  }

  async importProblems(input: ImportProblemsBody, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const lab = await practiceLabRepository.findLabById(institutionId, input.practiceLabId);
    if (!lab) throw new NotFoundError('Practice lab not found');
    await this.assertLabWrite(lab, actor);

    const createdIds: string[] = [];
    for (const item of input.problems) {
      const problem = await this.createProblem(
        { ...item, practiceLabId: input.practiceLabId },
        actor,
      );
      createdIds.push(problem.id);
      if (item.testCases?.length) {
        await practiceLabRepository.createTestCases(
          item.testCases.map((tc, idx) => ({
            institutionId,
            practiceLabId: input.practiceLabId,
            problemId: problem.id,
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            visibility: tc.visibility ?? 'hidden',
            weight: tc.weight ?? 1,
            timeoutMS: tc.timeoutMS ?? null,
            memoryLimitMB: tc.memoryLimitMB ?? null,
            order: tc.order ?? idx,
          })),
        );
      }
    }

    await this.audit('problems_imported', actor, {
      institutionId,
      practiceLabId: input.practiceLabId,
      metadata: { count: createdIds.length },
    });

    return { imported: createdIds.length, problemIds: createdIds };
  }

  // ------------------------------------------------------------------ test cases

  async listTestCases(problemId: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const problem = await practiceLabRepository.findProblemById(institutionId, problemId);
    if (!problem) throw new NotFoundError('Problem not found');
    const visibility = actor.role === 'student' ? 'public' : 'all';
    const items = await practiceLabRepository.listTestCases(problemId, visibility);
    return items.map((tc) => toTestCaseDto(tc, actor.role === 'student'));
  }

  async createTestCase(input: CreateTestCaseInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const problem = await practiceLabRepository.findProblemById(institutionId, input.problemId);
    if (!problem) throw new NotFoundError('Problem not found');
    const lab = await practiceLabRepository.findLabById(institutionId, String(problem.practiceLabId));
    if (!lab) throw new NotFoundError('Practice lab not found');
    await this.assertLabWrite(lab, actor);

    const doc = await practiceLabRepository.createTestCase({
      institutionId,
      practiceLabId: problem.practiceLabId,
      problemId: input.problemId,
      input: input.input,
      expectedOutput: input.expectedOutput,
      visibility: input.visibility ?? 'hidden',
      weight: input.weight ?? 1,
      timeoutMS: input.timeoutMS ?? null,
      memoryLimitMB: input.memoryLimitMB ?? null,
      order: input.order ?? 0,
    });
    await this.audit('testcase_created', actor, {
      institutionId,
      practiceLabId: String(problem.practiceLabId),
      problemId: input.problemId,
    });
    return toTestCaseDto(doc, false);
  }

  async updateTestCase(id: string, input: UpdateTestCaseInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const tc = await practiceLabRepository.findTestCaseById(institutionId, id);
    if (!tc) throw new NotFoundError('Test case not found');
    const lab = await practiceLabRepository.findLabById(institutionId, String(tc.practiceLabId));
    if (!lab) throw new NotFoundError('Practice lab not found');
    await this.assertLabWrite(lab, actor);
    const updated = await practiceLabRepository.updateTestCase(institutionId, id, input);
    await this.audit('testcase_updated', actor, {
      institutionId,
      practiceLabId: String(tc.practiceLabId),
      problemId: String(tc.problemId),
    });
    return toTestCaseDto(updated!, false);
  }

  async removeTestCase(id: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const tc = await practiceLabRepository.findTestCaseById(institutionId, id);
    if (!tc) throw new NotFoundError('Test case not found');
    const lab = await practiceLabRepository.findLabById(institutionId, String(tc.practiceLabId));
    if (!lab) throw new NotFoundError('Practice lab not found');
    await this.assertLabWrite(lab, actor);
    await practiceLabRepository.softDeleteTestCase(institutionId, id);
    await this.audit('testcase_deleted', actor, {
      institutionId,
      practiceLabId: String(tc.practiceLabId),
      problemId: String(tc.problemId),
    });
    return { id };
  }

  // ------------------------------------------------------------------ run / submit

  async runCode(input: RunCodeInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role !== 'student' && actor.role !== 'faculty' && !canManage(actor)) {
      throw new ForbiddenError('Not allowed to run code');
    }

    let studentId: string;
    if (actor.role === 'student') {
      studentId = await this.resolveStudentId(actor);
    } else {
      // faculty/admin dry-run uses a synthetic student pointer = user id string stored as ObjectId if student exists else skip progress
      const existing = await StudentModel.findOne({ userId: actor.userId, institutionId })
        .select('_id')
        .lean();
      studentId = existing ? String(existing._id) : actor.userId;
    }

    let practiceLabId = input.practiceLabId ?? null;
    let problemId = input.problemId ?? null;
    let timeLimitMS = 2000;
    let memoryLimitMB = 256;
    let stdin = input.stdin ?? '';

    if (problemId) {
      const problem = await practiceLabRepository.findProblemById(institutionId, problemId);
      if (!problem) throw new NotFoundError('Problem not found');
      const lab = await practiceLabRepository.findLabById(
        institutionId,
        String(problem.practiceLabId),
      );
      if (!lab) throw new NotFoundError('Practice lab not found');
      if (!lab.allowRun) throw new ValidationError('Run is disabled for this lab');
      if (!(problem.allowedLanguages as string[]).includes(input.language)) {
        throw new ValidationError('Language not allowed for this problem');
      }
      practiceLabId = String(problem.practiceLabId);
      timeLimitMS = problem.timeLimitMS;
      memoryLimitMB = problem.memoryLimitMB;
      if (!stdin && problem.sampleInput) stdin = problem.sampleInput;

      if (actor.role === 'student') {
        await this.assertStudentEnrolled(studentId, String(lab.courseId), institutionId);
      }
    }

    if (!Types.ObjectId.isValid(studentId)) {
      // faculty without student profile — still allow execution history under a placeholder ObjectId from user
      studentId = actor.userId;
    }

    const execution = await practiceLabRepository.createExecution({
      institutionId,
      practiceLabId,
      problemId,
      studentId,
      language: input.language,
      sourceCode: input.sourceCode,
      stdin,
      status: 'queued',
      isSubmission: false,
    });

    emitPracticeStatus(`user:${actor.userId}`, {
      executionId: String(execution._id),
      status: 'queued',
      queuePosition: 1,
    });

    eventBus.emit(EVENTS.EXECUTION_STARTED, {
      executionId: String(execution._id),
      studentId,
      institutionId,
    });
    await this.audit('execution_started', actor, {
      institutionId,
      practiceLabId,
      problemId,
      executionId: String(execution._id),
      studentId,
    });

    emitPracticeStatus(`user:${actor.userId}`, {
      executionId: String(execution._id),
      status: 'running',
    });

    const result = await judge0Client.createSubmissionAndWait({
      sourceCode: input.sourceCode,
      languageId: judge0IdForLanguage(input.language),
      stdin,
      cpuTimeLimit: timeLimitMS,
      wallTimeLimit: timeLimitMS + 1000,
      memoryLimit: memoryLimitMB,
    });

    let status = mapJudge0StatusToExecutionStatus(result.status.id);
    // For run (not submit), treat Judge0 "Accepted" as successful run; WA only applies when comparing expected
    if (status === 'wrong_answer') status = 'accepted';

    const updated = await practiceLabRepository.updateExecution(String(execution._id), {
      status,
      stdout: result.stdout,
      stderr: result.stderr,
      compileOutput: result.compile_output,
      exitCode: result.exit_code,
      executionTimeMS: result.time ? Math.round(parseFloat(result.time) * 1000) : null,
      memoryKB: result.memory,
      judge0Token: result.token,
    });

    emitPracticeStatus(`user:${actor.userId}`, {
      executionId: String(execution._id),
      status,
    });

    eventBus.emit(EVENTS.EXECUTION_FINISHED, {
      executionId: String(execution._id),
      studentId,
      institutionId,
      status,
    });
    eventBus.emit(EVENTS.EXECUTION_COMPLETED, {
      executionId: String(execution._id),
      studentId,
      institutionId,
      status,
    });
    await this.audit('execution_finished', actor, {
      institutionId,
      practiceLabId,
      problemId,
      executionId: String(execution._id),
      studentId,
      metadata: { status },
    });

    return {
      executionId: String(execution._id),
      status,
      stdout: updated?.stdout ?? result.stdout,
      stderr: updated?.stderr ?? result.stderr,
      compileOutput: updated?.compileOutput ?? result.compile_output,
      executionTimeMS: updated?.executionTimeMS ?? null,
      memoryKB: updated?.memoryKB ?? result.memory,
      exitCode: updated?.exitCode ?? result.exit_code,
      queuePosition: null,
    };
  }

  async submitSolution(input: SubmitSolutionInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role !== 'student') throw new ForbiddenError('Only students can submit solutions');
    const studentId = await this.resolveStudentId(actor);

    const problem = await practiceLabRepository.findProblemById(institutionId, input.problemId);
    if (!problem) throw new NotFoundError('Problem not found');
    const lab = await practiceLabRepository.findLabById(institutionId, String(problem.practiceLabId));
    if (!lab) throw new NotFoundError('Practice lab not found');
    if (lab.status !== 'published') throw new ValidationError('Lab is not open for submissions');
    if (!lab.allowSubmit) throw new ValidationError('Submit is disabled for this lab');
    if (!(problem.allowedLanguages as string[]).includes(input.language)) {
      throw new ValidationError('Language not allowed');
    }

    await this.assertStudentEnrolled(studentId, String(lab.courseId), institutionId);

    const previousAttempts = await practiceLabRepository.countSubmissionsForProblem(
      studentId,
      input.problemId,
    );
    const attemptCheck = evaluateAttempt({
      previousAttempts,
      maxAttempts: lab.maxSubmissions,
      allowResubmission: true,
    });
    if (!attemptCheck.allowed) {
      throw new ValidationError(attemptCheck.reason ?? 'Max submissions reached');
    }

    const testCases = await practiceLabRepository.listTestCases(input.problemId, 'all');
    if (testCases.length === 0) {
      throw new ValidationError('Problem has no test cases');
    }

    const submission = await practiceLabRepository.createSubmission({
      institutionId,
      practiceLabId: problem.practiceLabId,
      problemId: input.problemId,
      studentId,
      language: input.language,
      sourceCode: input.sourceCode,
      verdict: 'pending',
      score: 0,
      maxScore: testCases.reduce((s, t) => s + t.weight, 0),
      passedCount: 0,
      totalCount: testCases.length,
      attemptNumber: attemptCheck.nextAttempt,
      results: [],
    });

    eventBus.emit(EVENTS.LAB_SUBMISSION_CREATED, {
      submissionId: String(submission._id),
      problemId: input.problemId,
      practiceLabId: String(problem.practiceLabId),
      studentId,
      institutionId,
    });
    eventBus.emit(EVENTS.LAB_SUBMITTED, {
      labId: String(problem.practiceLabId),
      userId: actor.userId,
    });
    await this.audit('submission_created', actor, {
      institutionId,
      practiceLabId: String(problem.practiceLabId),
      problemId: input.problemId,
      submissionId: String(submission._id),
      studentId,
    });

    emitPracticeStatus(`user:${actor.userId}`, {
      executionId: String(submission._id),
      submissionId: String(submission._id),
      status: 'running',
    });

    const results: StudentSubmission['results'] = [];
    let compileOutput: string | null = null;
    let maxTime: number | null = null;
    let maxMem: number | null = null;

    for (const tc of testCases) {
      const judge = await judge0Client.createSubmissionAndWait({
        sourceCode: input.sourceCode,
        languageId: judge0IdForLanguage(input.language),
        stdin: tc.input,
        cpuTimeLimit: tc.timeoutMS ?? problem.timeLimitMS,
        wallTimeLimit: (tc.timeoutMS ?? problem.timeLimitMS) + 1000,
        memoryLimit: tc.memoryLimitMB ?? problem.memoryLimitMB,
      });

      let status = mapJudge0StatusToExecutionStatus(judge.status.id);
      if (judge.compile_output) compileOutput = judge.compile_output;

      const timeMs = judge.time ? Math.round(parseFloat(judge.time) * 1000) : null;
      if (timeMs != null) maxTime = Math.max(maxTime ?? 0, timeMs);
      if (judge.memory != null) maxMem = Math.max(maxMem ?? 0, judge.memory);

      let passed = false;
      if (status === 'compilation_error') {
        passed = false;
      } else if (status === 'accepted' || status === 'wrong_answer') {
        passed = outputsMatch(judge.stdout, tc.expectedOutput);
        status = passed ? 'accepted' : 'wrong_answer';
      }

      results.push({
        testCaseId: String(tc._id),
        visibility: tc.visibility as 'public' | 'hidden',
        status,
        stdout: judge.stdout,
        stderr: judge.stderr,
        expectedOutput: tc.expectedOutput,
        executionTimeMS: timeMs,
        memoryKB: judge.memory,
        weight: tc.weight,
        passed,
      });

      if (status === 'compilation_error') break;
    }

    const scored = computeSubmissionScore(results);
    const updated = await practiceLabRepository.updateSubmission(String(submission._id), {
      verdict: scored.verdict,
      score: scored.score,
      maxScore: scored.maxScore,
      passedCount: scored.passedCount,
      totalCount: scored.totalCount,
      executionTimeMS: maxTime,
      memoryKB: maxMem,
      compileOutput,
      results,
    });

    await practiceLabRepository.createExecution({
      institutionId,
      practiceLabId: problem.practiceLabId,
      problemId: input.problemId,
      studentId,
      language: input.language,
      sourceCode: input.sourceCode,
      stdin: null,
      stdout: null,
      stderr: null,
      compileOutput,
      status:
        scored.verdict === 'accepted'
          ? 'accepted'
          : scored.verdict === 'compilation_error'
            ? 'compilation_error'
            : scored.verdict === 'runtime_error'
              ? 'runtime_error'
              : 'wrong_answer',
      executionTimeMS: maxTime,
      memoryKB: maxMem,
      submissionId: submission._id,
      isSubmission: true,
    });

    await this.updateProgressAfterSubmission({
      institutionId,
      practiceLabId: String(problem.practiceLabId),
      studentId,
      verdict: scored.verdict,
      totalProblems: lab.problemCount ?? 0,
    });

    if (scored.verdict === 'accepted') {
      eventBus.emit(EVENTS.LAB_SUBMISSION_ACCEPTED, {
        submissionId: String(submission._id),
        problemId: input.problemId,
        practiceLabId: String(problem.practiceLabId),
        studentId,
        institutionId,
      });
      eventBus.emit(EVENTS.PROBLEM_SOLVED, {
        problemId: input.problemId,
        practiceLabId: String(problem.practiceLabId),
        studentId,
        institutionId,
        submissionId: String(submission._id),
      });
      await this.audit('submission_accepted', actor, {
        institutionId,
        practiceLabId: String(problem.practiceLabId),
        problemId: input.problemId,
        submissionId: String(submission._id),
        studentId,
      });
    } else {
      eventBus.emit(EVENTS.LAB_SUBMISSION_FAILED, {
        submissionId: String(submission._id),
        problemId: input.problemId,
        practiceLabId: String(problem.practiceLabId),
        studentId,
        institutionId,
        verdict: scored.verdict,
      });
      await this.audit('submission_failed', actor, {
        institutionId,
        practiceLabId: String(problem.practiceLabId),
        problemId: input.problemId,
        submissionId: String(submission._id),
        studentId,
        metadata: { verdict: scored.verdict },
      });
    }

    emitPracticeStatus(`user:${actor.userId}`, {
      executionId: String(submission._id),
      submissionId: String(submission._id),
      status: scored.verdict,
    });

    return toSubmissionDto(updated!);
  }

  private async updateProgressAfterSubmission(input: {
    institutionId: string;
    practiceLabId: string;
    studentId: string;
    verdict: StudentSubmission['verdict'];
    totalProblems: number;
  }) {
    const existing = await practiceLabRepository.findProgress(
      input.institutionId,
      input.practiceLabId,
      input.studentId,
    );

    const acceptedProblemIds = await StudentCodeSubmissionModel.distinct('problemId', {
      institutionId: input.institutionId,
      practiceLabId: input.practiceLabId,
      studentId: input.studentId,
      verdict: 'accepted',
      deletedAt: null,
    });

    const problemsSolved = acceptedProblemIds.length;
    const attempts = (existing?.attempts ?? 0) + 1;
    const accepted = (existing?.accepted ?? 0) + (input.verdict === 'accepted' ? 1 : 0);
    const wrongAnswers =
      (existing?.wrongAnswers ?? 0) +
      (input.verdict === 'wrong_answer' || input.verdict === 'partial' ? 1 : 0);
    const runtimeErrors =
      (existing?.runtimeErrors ?? 0) + (input.verdict === 'runtime_error' ? 1 : 0);
    const compilationErrors =
      (existing?.compilationErrors ?? 0) + (input.verdict === 'compilation_error' ? 1 : 0);
    const successRate = attempts === 0 ? 0 : Math.round((accepted / attempts) * 1000) / 10;
    const completedAt =
      input.totalProblems > 0 && problemsSolved >= input.totalProblems ? new Date() : null;

    await LabProgressModel.findOneAndUpdate(
      {
        institutionId: input.institutionId,
        practiceLabId: input.practiceLabId,
        studentId: input.studentId,
      },
      {
        $set: {
          problemsSolved,
          totalProblems: input.totalProblems,
          attempts,
          accepted,
          wrongAnswers,
          runtimeErrors,
          compilationErrors,
          successRate,
          lastSolvedAt: input.verdict === 'accepted' ? new Date() : existing?.lastSolvedAt ?? null,
          completedAt,
          streakDays: existing?.streakDays ?? 0,
        },
        $setOnInsert: {
          institutionId: input.institutionId,
          practiceLabId: input.practiceLabId,
          studentId: input.studentId,
          timeSpentSeconds: 0,
        },
      },
      { upsert: true, new: true },
    );

    if (completedAt) {
      eventBus.emit(EVENTS.LAB_COMPLETED, {
        labId: input.practiceLabId,
        studentId: input.studentId,
        institutionId: input.institutionId,
      });
    }
  }

  async listSubmissions(query: SubmissionListQuery, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const filter = practiceLabRepository.buildSubmissionFilter(institutionId, query);
    if (actor.role === 'student') {
      const studentId = await this.resolveStudentId(actor);
      filter.studentId = new Types.ObjectId(studentId);
    } else if (actor.role === 'faculty' && !canManage(actor) && !query.studentId) {
      const labs = await PracticeLabModel.find({
        institutionId,
        createdBy: actor.userId,
        deletedAt: null,
      })
        .select('_id')
        .lean();
      filter.practiceLabId = { $in: labs.map((l) => l._id) };
    }
    const result = await practiceLabRepository.listSubmissions(filter, query);
    return {
      items: result.items.map(toSubmissionDto),
      meta: pageMeta(result.total, result.page, result.limit),
    };
  }

  async getSubmission(id: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const submission = await practiceLabRepository.findSubmissionById(institutionId, id);
    if (!submission) throw new NotFoundError('Submission not found');
    if (actor.role === 'student') {
      const studentId = await this.resolveStudentId(actor);
      if (String(submission.studentId) !== studentId) {
        throw new ForbiddenError('Not your submission');
      }
    }
    return toSubmissionDto(submission);
  }

  async listExecutions(query: Record<string, unknown>, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const q = { ...query } as {
      practiceLabId?: string;
      problemId?: string;
      studentId?: string;
      language?: PracticeLanguage;
      isSubmission?: boolean;
      page?: number;
      limit?: number;
    };
    if (actor.role === 'student') {
      q.studentId = await this.resolveStudentId(actor);
    }
    const result = await practiceLabRepository.listExecutions(institutionId, q);
    return {
      items: result.items.map(toExecutionDto),
      meta: pageMeta(result.total, result.page, result.limit),
    };
  }

  async getProgress(practiceLabId: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const studentId =
      actor.role === 'student'
        ? await this.resolveStudentId(actor)
        : ((actor as ActorContext & { studentId?: string }).studentId ??
          (await this.resolveStudentId(actor).catch(() => null)));
    if (!studentId) throw new ValidationError('studentId required');
    const progress = await practiceLabRepository.findProgress(
      institutionId,
      practiceLabId,
      studentId,
    );
    if (!progress) {
      const lab = await practiceLabRepository.findLabById(institutionId, practiceLabId);
      return {
        id: '',
        institutionId,
        practiceLabId,
        studentId,
        problemsSolved: 0,
        totalProblems: lab?.problemCount ?? 0,
        attempts: 0,
        accepted: 0,
        wrongAnswers: 0,
        runtimeErrors: 0,
        compilationErrors: 0,
        timeSpentSeconds: 0,
        successRate: 0,
        streakDays: 0,
        lastSolvedAt: null,
        completedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } satisfies LabProgressDto;
    }
    return {
      id: String(progress._id),
      institutionId: String(progress.institutionId),
      practiceLabId: String(progress.practiceLabId),
      studentId: String(progress.studentId),
      problemsSolved: progress.problemsSolved,
      totalProblems: progress.totalProblems,
      attempts: progress.attempts,
      accepted: progress.accepted,
      wrongAnswers: progress.wrongAnswers,
      runtimeErrors: progress.runtimeErrors,
      compilationErrors: progress.compilationErrors,
      timeSpentSeconds: progress.timeSpentSeconds,
      successRate: progress.successRate,
      streakDays: progress.streakDays,
      lastSolvedAt: toIso(progress.lastSolvedAt),
      completedAt: toIso(progress.completedAt),
      createdAt: toIso(progress.createdAt) ?? new Date().toISOString(),
      updatedAt: toIso(progress.updatedAt) ?? new Date().toISOString(),
    };
  }

  async leaderboard(query: LeaderboardQuery, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (!query.practiceLabId && query.scope === 'lab') {
      throw new ValidationError('practiceLabId required for lab leaderboard');
    }

    let progressRows = query.practiceLabId
      ? await practiceLabRepository.listProgressForLab(institutionId, query.practiceLabId)
      : await LabProgressModel.find({ institutionId }).sort({ problemsSolved: -1 }).limit(200).exec();

    if (query.problemId) {
      const accepted = await StudentCodeSubmissionModel.aggregate([
        {
          $match: {
            institutionId: new Types.ObjectId(institutionId),
            problemId: new Types.ObjectId(query.problemId),
            verdict: 'accepted',
            deletedAt: null,
          },
        },
        {
          $group: {
            _id: '$studentId',
            solvedCount: { $sum: 1 },
            totalTimeMS: { $sum: { $ifNull: ['$executionTimeMS', 0] } },
            attempts: { $sum: 1 },
          },
        },
        { $sort: { solvedCount: -1, totalTimeMS: 1 } },
        { $limit: query.limit ?? 50 },
      ]);

      const entries: LeaderboardEntry[] = [];
      let rank = 1;
      for (const row of accepted) {
        const user = await StudentModel.findById(row._id).select('userId firstName lastName').lean();
        const display =
          user && 'firstName' in user
            ? `${(user as { firstName?: string }).firstName ?? ''} ${(user as { lastName?: string }).lastName ?? ''}`.trim()
            : String(row._id);
        entries.push({
          rank: rank++,
          studentId: String(row._id),
          displayName: display || String(row._id),
          solvedCount: row.solvedCount,
          attempts: row.attempts,
          accuracy: 100,
          totalTimeMS: row.totalTimeMS,
          score: row.solvedCount,
        });
      }
      return { items: entries, meta: pageMeta(entries.length, 1, query.limit ?? 50) };
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const slice = progressRows.slice((page - 1) * limit, page * limit);
    const entries: LeaderboardEntry[] = [];
    let rank = (page - 1) * limit + 1;
    for (const row of slice) {
      const student = await StudentModel.findById(row.studentId).select('userId').lean();
      let displayName = String(row.studentId);
      if (student?.userId) {
        const user = await UserModel.findById(student.userId).select('firstName lastName').lean();
        if (user) displayName = `${user.firstName} ${user.lastName}`.trim();
      }
      entries.push({
        rank: rank++,
        studentId: String(row.studentId),
        displayName,
        solvedCount: row.problemsSolved,
        attempts: row.attempts,
        accuracy: row.successRate,
        totalTimeMS: (row.timeSpentSeconds ?? 0) * 1000,
        score: row.problemsSolved,
      });
    }
    return { items: entries, meta: pageMeta(progressRows.length, page, limit) };
  }

  async listLanguages() {
    let langs = await practiceLabRepository.listLanguages(true);
    if (langs.length === 0) {
      await practiceLabRepository.upsertLanguages(
        PRACTICE_LANGUAGES.map((key, order) => ({
          key,
          name: PRACTICE_LANGUAGE_META[key].name,
          judge0Id: JUDGE0_LANGUAGE_IDS[key],
          monacoLanguage: PRACTICE_LANGUAGE_META[key].monacoLanguage,
          version: PRACTICE_LANGUAGE_META[key].version,
          enabled: true,
          order,
        })),
      );
      langs = await practiceLabRepository.listLanguages(true);
    }
    return langs.map((l) => ({
      id: String(l._id),
      key: l.key as PracticeLanguage,
      name: l.name,
      judge0Id: l.judge0Id,
      monacoLanguage: l.monacoLanguage,
      version: l.version ?? null,
      enabled: l.enabled,
      order: l.order,
    }));
  }

  async institutionDashboard(actor: ActorContext): Promise<PracticeLabStats> {
    const institutionId = requireTenant(actor);
    if (!canManage(actor)) throw new ForbiddenError('Manage permission required');

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [totalLabs, totalProblems, executionsToday, acceptedRate] = await Promise.all([
      PracticeLabModel.countDocuments({ institutionId, deletedAt: null }),
      LabProblemModel.countDocuments({ institutionId, deletedAt: null }),
      practiceLabRepository.countExecutionsSince(institutionId, startOfDay),
      practiceLabRepository.countAcceptedRate(institutionId),
    ]);

    const languageAgg = await StudentCodeSubmissionModel.aggregate([
      { $match: { institutionId: new Types.ObjectId(institutionId), deletedAt: null } },
      { $group: { _id: '$language', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const topCourses = await PracticeLabModel.aggregate([
      { $match: { institutionId: new Types.ObjectId(institutionId), deletedAt: null } },
      { $group: { _id: '$courseId', labs: { $sum: 1 } } },
      { $sort: { labs: -1 } },
      { $limit: 5 },
    ]);

    const courseDocs = await CourseModel.find({
      _id: { $in: topCourses.map((c) => c._id) },
    })
      .select('title')
      .lean();
    const courseMap = new Map(courseDocs.map((c) => [String(c._id), c.title]));

    const mostSolved = await StudentCodeSubmissionModel.aggregate([
      {
        $match: {
          institutionId: new Types.ObjectId(institutionId),
          verdict: 'accepted',
          deletedAt: null,
        },
      },
      { $group: { _id: '$problemId', solvedCount: { $sum: 1 } } },
      { $sort: { solvedCount: -1 } },
      { $limit: 5 },
    ]);
    const problems = await LabProblemModel.find({
      _id: { $in: mostSolved.map((m) => m._id) },
    })
      .select('title')
      .lean();
    const problemMap = new Map(problems.map((p) => [String(p._id), p.title]));

    return {
      totalLabs,
      totalProblems,
      executionsToday,
      acceptedRate,
      languagesUsed: languageAgg.map((l) => ({
        language: l._id as PracticeLanguage,
        count: l.count,
      })),
      topCourses: topCourses.map((c) => ({
        courseId: String(c._id),
        title: courseMap.get(String(c._id)) ?? 'Course',
        labs: c.labs,
      })),
      mostSolvedProblems: mostSolved.map((m) => ({
        problemId: String(m._id),
        title: problemMap.get(String(m._id)) ?? 'Problem',
        solvedCount: m.solvedCount,
      })),
    };
  }

  async facultyDashboard(actor: ActorContext): Promise<FacultyPracticeLabDashboard> {
    const institutionId = requireTenant(actor);
    const labFilter =
      canManage(actor)
        ? { institutionId, deletedAt: null }
        : { institutionId, createdBy: actor.userId, deletedAt: null };

    const labs = await PracticeLabModel.find(labFilter).select('_id').lean();
    const labIds = labs.map((l) => l._id);
    const [labsCreated, problems, attempts] = await Promise.all([
      labs.length,
      LabProblemModel.countDocuments({ practiceLabId: { $in: labIds }, deletedAt: null }),
      StudentCodeSubmissionModel.countDocuments({
        practiceLabId: { $in: labIds },
        deletedAt: null,
      }),
    ]);

    const accepted = await StudentCodeSubmissionModel.countDocuments({
      practiceLabId: { $in: labIds },
      verdict: 'accepted',
      deletedAt: null,
    });
    const averageSuccessRate = attempts === 0 ? 0 : Math.round((accepted / attempts) * 1000) / 10;

    const difficult = await StudentCodeSubmissionModel.aggregate([
      {
        $match: {
          practiceLabId: { $in: labIds },
          deletedAt: null,
        },
      },
      {
        $group: {
          _id: '$problemId',
          total: { $sum: 1 },
          accepted: {
            $sum: { $cond: [{ $eq: ['$verdict', 'accepted'] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          successRate: {
            $cond: [
              { $eq: ['$total', 0] },
              0,
              { $multiply: [{ $divide: ['$accepted', '$total'] }, 100] },
            ],
          },
        },
      },
      { $sort: { successRate: 1 } },
      { $limit: 5 },
    ]);

    const problemDocs = await LabProblemModel.find({
      _id: { $in: difficult.map((d) => d._id) },
    })
      .select('title')
      .lean();
    const titles = new Map(problemDocs.map((p) => [String(p._id), p.title]));

    return {
      labsCreated,
      problems,
      studentAttempts: attempts,
      averageSuccessRate,
      mostDifficultProblems: difficult.map((d) => ({
        problemId: String(d._id),
        title: titles.get(String(d._id)) ?? 'Problem',
        successRate: Math.round(d.successRate * 10) / 10,
      })),
    };
  }

  async studentDashboard(actor: ActorContext): Promise<StudentPracticeLabDashboard> {
    const institutionId = requireTenant(actor);
    const studentId = await this.resolveStudentId(actor);

    const [progressRows, recent, langStats, pending] = await Promise.all([
      LabProgressModel.find({ institutionId, studentId }).lean(),
      StudentCodeSubmissionModel.find({ institutionId, studentId, deletedAt: null })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      StudentCodeSubmissionModel.aggregate([
        {
          $match: {
            institutionId: new Types.ObjectId(institutionId),
            studentId: new Types.ObjectId(studentId),
            deletedAt: null,
          },
        },
        { $group: { _id: '$language', count: { $sum: 1 } } },
      ]),
      StudentCodeSubmissionModel.countDocuments({
        institutionId,
        studentId,
        verdict: 'pending',
        deletedAt: null,
      }),
    ]);

    const problemsSolved = progressRows.reduce((s, p) => s + (p.problemsSolved ?? 0), 0);
    const accepted = progressRows.reduce((s, p) => s + (p.accepted ?? 0), 0);
    const streak = Math.max(0, ...progressRows.map((p) => p.streakDays ?? 0), 0);

    const problemIds = recent.map((r) => r.problemId);
    const problems = await LabProblemModel.find({ _id: { $in: problemIds } })
      .select('title')
      .lean();
    const titleMap = new Map(problems.map((p) => [String(p._id), p.title]));

    return {
      practiceStreak: streak,
      problemsSolved,
      accepted,
      pending,
      recentActivity: recent.map((r) => ({
        problemId: String(r.problemId),
        title: titleMap.get(String(r.problemId)) ?? 'Problem',
        verdict: r.verdict as StudentSubmission['verdict'],
        at: toIso(r.createdAt) ?? new Date().toISOString(),
      })),
      languageStatistics: langStats.map((l) => ({
        language: l._id as PracticeLanguage,
        count: l.count,
      })),
    };
  }

  async listAudit(actor: ActorContext, page = 1, limit = 50) {
    const institutionId = requireTenant(actor);
    if (!canManage(actor)) throw new ForbiddenError('Manage permission required');
    const result = await practiceLabRepository.listAudit(institutionId, page, limit);
    return {
      items: result.items.map((a) => ({
        id: String(a._id),
        event: a.event,
        practiceLabId: a.practiceLabId ? String(a.practiceLabId) : null,
        problemId: a.problemId ? String(a.problemId) : null,
        userId: a.userId ? String(a.userId) : null,
        email: a.email,
        metadata: a.metadata,
        createdAt: toIso(a.createdAt),
      })),
      meta: pageMeta(result.total, result.page, result.limit),
    };
  }
}

export const practiceLabService = new PracticeLabService();
