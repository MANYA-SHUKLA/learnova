import { randomBytes } from 'node:crypto';
import { Types } from 'mongoose';
import type {
  ApplyExamBlueprintInput,
  AssignInvigilatorsInput,
  CreateExamBlueprintInput,
  CreateExamFromTemplateInput,
  CreateExamTemplateInput,
  HeartbeatExamAttemptInput,
  ResumeExamAttemptInput,
  UpsertExamAccessibilityInput,
} from '@learnova/validation';
import { EXAM_DEFAULTS } from '@learnova/constants';
import { examinationEngine } from '../examination-engine/index.js';
import { examinationRepository } from '../../repositories/examination/index.js';
import { emitAttemptLive, emitExamLive } from '../../socket/exam-live.js';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../utils/errors/index.js';
import type { ActorContext } from './examination.service.js';

function oid(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}

function sessionToken(): string {
  return randomBytes(24).toString('hex');
}

function toDto(doc: { _id: Types.ObjectId; toObject?: () => Record<string, unknown> }) {
  const raw =
    typeof doc.toObject === 'function'
      ? doc.toObject()
      : (doc as unknown as Record<string, unknown>);
  const { _id, __v, ...rest } = raw as Record<string, unknown> & { _id: Types.ObjectId; __v?: number };
  return { id: String(_id), ...rest };
}

export async function recordExamIncident(input: {
  institutionId: string;
  examId: string;
  attemptId?: string | null;
  actorId?: string | null;
  incidentType: string;
  severity?: 'info' | 'warning' | 'critical';
  message?: string | null;
  metadata?: Record<string, unknown>;
}) {
  return examinationRepository.createIncident({
    institutionId: oid(input.institutionId),
    examId: oid(input.examId),
    attemptId: input.attemptId ? oid(input.attemptId) : null,
    actorId: input.actorId ? oid(input.actorId) : null,
    incidentType: input.incidentType,
    severity: input.severity ?? 'info',
    message: input.message ?? null,
    metadata: input.metadata ?? {},
  });
}

export async function createPublishedExamVersion(
  institutionId: string,
  examId: string,
  actorId: string,
) {
  const exam = await examinationRepository.findExamById(institutionId, examId);
  if (!exam) throw new NotFoundError('Exam not found');

  const sections = await examinationRepository.listSectionsByExam(institutionId, examId);
  const nextVersion = (exam.versionNumber ?? 0) + 1;

  const version = await examinationRepository.createExamVersion({
    institutionId: oid(institutionId),
    examId: exam._id,
    versionNumber: nextVersion,
    snapshot: {
      title: exam.title,
      instructions: exam.instructions,
      schedule: exam.schedule,
      proctoring: exam.proctoring,
      rules: exam.rules,
      questionIds: exam.questionIds.map(String),
      sections: sections.map((s) => ({
        title: s.title,
        marks: s.marks,
        questionIds: s.questionIds.map(String),
        randomizeQuestions: s.randomizeQuestions,
        randomQuestionCount: s.randomQuestionCount,
      })),
      reconnectionGraceMinutes: exam.reconnectionGraceMinutes ?? EXAM_DEFAULTS.RECONNECTION_GRACE_MINUTES,
    },
    publishedAt: new Date(),
    publishedBy: oid(actorId),
    immutable: true,
  });

  await examinationRepository.updateExamById(institutionId, examId, {
    publishedVersionId: version._id,
    versionNumber: nextVersion,
  });

  await recordExamIncident({
    institutionId,
    examId,
    actorId,
    incidentType: 'exam.version_created',
    message: `Published version ${String(nextVersion)}`,
    metadata: { versionId: String(version._id), versionNumber: nextVersion },
  });

  return version;
}

export async function resolveVersionSnapshot(institutionId: string, exam: {
  _id: Types.ObjectId;
  publishedVersionId?: Types.ObjectId | null;
  questionIds: Types.ObjectId[];
  rules: Record<string, unknown>;
  proctoring: Record<string, unknown>;
  schedule: Record<string, unknown>;
  reconnectionGraceMinutes?: number | null;
}) {
  if (!exam.publishedVersionId) return exam;
  const version = await examinationRepository.findExamVersionById(
    institutionId,
    String(exam.publishedVersionId),
  );
  if (!version) return exam;
  const snap = version.snapshot as Record<string, unknown>;
  return {
    ...exam,
    questionIds: ((snap.questionIds as string[]) ?? []).map(oid),
    rules: { ...exam.rules, ...(snap.rules as Record<string, unknown>) },
    proctoring: { ...exam.proctoring, ...(snap.proctoring as Record<string, unknown>) },
    schedule: { ...exam.schedule, ...(snap.schedule as Record<string, unknown>) },
    reconnectionGraceMinutes:
      (snap.reconnectionGraceMinutes as number) ?? exam.reconnectionGraceMinutes,
    _versionSnapshot: snap,
  };
}

export async function createBlueprint(input: CreateExamBlueprintInput, actor: ActorContext) {
  const institutionId = actor.institutionId!;
  const doc = await examinationRepository.createBlueprint({
    institutionId: oid(institutionId),
    courseId: input.courseId ? oid(input.courseId) : null,
    name: input.name,
    description: input.description ?? null,
    totalMarks: input.totalMarks,
    slots: input.slots,
    questionPoolIds: (input.questionPoolIds ?? []).map(oid),
    createdBy: oid(actor.userId),
    deletedAt: null,
  });
  return toDto(doc);
}

export async function listBlueprints(actor: ActorContext) {
  const institutionId = actor.institutionId!;
  const rows = await examinationRepository.listBlueprints(institutionId);
  return rows.map((r) => toDto(r));
}

export async function applyBlueprint(input: ApplyExamBlueprintInput, actor: ActorContext) {
  const institutionId = actor.institutionId!;
  const blueprint = await examinationRepository.findBlueprintById(institutionId, input.blueprintId);
  if (!blueprint) throw new NotFoundError('Blueprint not found');

  const poolIds = blueprint.questionPoolIds.map(String);
  const questions = await examinationRepository.findQuestionsByIds(institutionId, poolIds);
  const selected = examinationEngine.selectQuestionsByBlueprint(
    questions.map((q) => ({
      id: String(q._id),
      difficulty: q.difficulty ?? 'medium',
      category: q.category ?? null,
      marks: q.marks,
    })),
    blueprint.slots.map((s) => ({
      difficulty: s.difficulty ?? null,
      category: s.category ?? null,
      marks: s.marks ?? null,
      count: s.count,
    })),
  );

  await examinationRepository.updateExamById(institutionId, input.examId, {
    questionIds: selected.map(oid),
    blueprintId: blueprint._id,
  });

  return { examId: input.examId, questionIds: selected, totalSelected: selected.length };
}

export async function createTemplate(input: CreateExamTemplateInput, actor: ActorContext) {
  const institutionId = actor.institutionId!;
  const doc = await examinationRepository.createTemplate({
    institutionId: oid(institutionId),
    ...input,
    policyId: input.policyId ? oid(input.policyId) : null,
    blueprintId: input.blueprintId ? oid(input.blueprintId) : null,
    createdBy: oid(actor.userId),
    deletedAt: null,
  });
  return toDto(doc);
}

export async function listTemplates(actor: ActorContext) {
  const institutionId = actor.institutionId!;
  return (await examinationRepository.listTemplates(institutionId)).map((r) => toDto(r));
}

export async function createExamFromTemplate(
  input: CreateExamFromTemplateInput,
  actor: ActorContext,
  createExamFn: (body: Record<string, unknown>, actor: ActorContext) => Promise<Record<string, unknown>>,
) {
  const institutionId = actor.institutionId!;
  const template = await examinationRepository.findTemplateById(institutionId, input.templateId);
  if (!template) throw new NotFoundError('Template not found');

  return createExamFn(
    {
      courseId: input.courseId,
      title: input.title,
      schedule: input.schedule,
      examType: template.examType,
      visibility: template.visibility,
      proctoring: {
        mode: template.proctoringMode,
        secureBrowser: template.secureBrowser,
        requireWebcam: template.requireWebcam,
        requireMicrophone: template.requireMicrophone,
      },
      rules: {
        passingMarks: template.passingMarks,
        totalMarks: template.totalMarks,
        durationMinutes: template.durationMinutes,
        attemptLimit: template.attemptLimit,
        negativeMarking: template.negativeMarking,
        shuffleQuestions: template.shuffleQuestions,
        shuffleOptions: template.shuffleOptions,
      },
      seatingEnabled: false,
      sections: template.sections ?? [],
      questionIds: [],
    },
    actor,
  );
}

export async function assignInvigilators(input: AssignInvigilatorsInput, actor: ActorContext) {
  const institutionId = actor.institutionId!;
  const exam = await examinationRepository.findExamById(institutionId, input.examId);
  if (!exam) throw new NotFoundError('Exam not found');

  const rows = [];
  for (const item of input.assignments) {
    const row = await examinationRepository.upsertInvigilator({
      institutionId: oid(institutionId),
      examId: oid(input.examId),
      userId: oid(item.userId),
      role: item.role,
      assignedBy: oid(actor.userId),
    });
    rows.push(toDto(row));
  }
  return rows;
}

export async function listInvigilators(examId: string, actor: ActorContext) {
  const institutionId = actor.institutionId!;
  return (await examinationRepository.listInvigilators(institutionId, examId)).map((r) =>
    toDto(r),
  );
}

export async function assertInvigilatorPermission(
  examId: string,
  actor: ActorContext,
  required: 'view_only' | 'monitor' | 'intervene',
) {
  if (['institution_admin', 'super_admin'].includes(actor.role)) return;
  const institutionId = actor.institutionId!;
  const row = await examinationRepository.findInvigilator(institutionId, examId, actor.userId);
  if (!row) throw new ForbiddenError('Not assigned as invigilator for this exam');
  const order = { view_only: 1, monitor: 2, intervene: 3 };
  if (order[row.role as keyof typeof order] < order[required]) {
    throw new ForbiddenError(`Invigilator role ${row.role} cannot perform this action`);
  }
}

export async function getIncidentTimeline(
  examId: string,
  actor: ActorContext,
  attemptId?: string,
) {
  const institutionId = actor.institutionId!;
  const rows = await examinationRepository.listIncidents(institutionId, examId, attemptId);
  return rows.map((r) => toDto(r));
}

export async function upsertAccessibility(input: UpsertExamAccessibilityInput, actor: ActorContext) {
  const institutionId = actor.institutionId!;
  const doc = await examinationRepository.upsertAccessibility({
    institutionId: oid(institutionId),
    examId: oid(input.examId),
    studentId: oid(input.studentId),
    extendedTimePercent: input.extendedTimePercent,
    extraMinutes: input.extraMinutes,
    fontSize: input.fontSize,
    screenReaderAllowed: input.screenReaderAllowed,
    notes: input.notes ?? null,
    approvedBy: oid(actor.userId),
  });

  await recordExamIncident({
    institutionId,
    examId: input.examId,
    actorId: actor.userId,
    incidentType: 'accessibility.applied',
    message: `Accessibility updated for student ${input.studentId}`,
    metadata: { studentId: input.studentId, fontSize: input.fontSize },
  });

  return toDto(doc);
}

export async function listAccessibility(examId: string, actor: ActorContext) {
  const institutionId = actor.institutionId!;
  return (await examinationRepository.listAccessibility(institutionId, examId)).map((r) =>
    toDto(r),
  );
}

export function computeExtendedDurationMinutes(
  baseMinutes: number,
  accommodation: { extendedTimePercent?: number; extraMinutes?: number } | null,
): number {
  if (!accommodation) return baseMinutes;
  const percentExtra = Math.round(baseMinutes * ((accommodation.extendedTimePercent ?? 0) / 100));
  return baseMinutes + percentExtra + (accommodation.extraMinutes ?? 0);
}

export async function resumeAttempt(input: ResumeExamAttemptInput, actor: ActorContext) {
  const institutionId = actor.institutionId!;
  if (actor.role !== 'student') throw new ForbiddenError('Only students can resume attempts');

  const attempt = await examinationRepository.findAttemptBySessionToken(
    institutionId,
    input.sessionToken,
  );
  if (!attempt) throw new NotFoundError('Session not found');

  const exam = await examinationRepository.findExamById(institutionId, String(attempt.examId));
  if (!exam) throw new NotFoundError('Exam not found');

  const graceMinutes = exam.reconnectionGraceMinutes ?? EXAM_DEFAULTS.RECONNECTION_GRACE_MINUTES;
  const disconnectedAt = attempt.disconnectedAt ?? attempt.lastSeenAt;
  if (!disconnectedAt) throw new ConflictError('Attempt is not in a disconnected state');

  const elapsedMs = Date.now() - disconnectedAt.getTime();
  if (elapsedMs > graceMinutes * 60 * 1000) {
    throw new ConflictError('Reconnection grace period has expired');
  }

  if (!['disconnected', 'started'].includes(attempt.status)) {
    throw new ConflictError('Attempt cannot be resumed');
  }

  const updated = await examinationRepository.updateAttemptById(
    institutionId,
    String(attempt._id),
    {
      status: 'started',
      resumedAt: new Date(),
      lastSeenAt: new Date(),
      reconnectCount: (attempt.reconnectCount ?? 0) + 1,
      disconnectedAt: null,
    },
  );

  const answers = await examinationRepository.listAnswersByAttempt(String(attempt._id));
  const questionIds = (attempt.selectedQuestionIds ?? []).map(String);
  const questions = await examinationRepository.findQuestionsByIds(institutionId, questionIds);
  const rendered = questions.map((q) =>
    examinationEngine.renderQuestionForAttempt(q, {
      shuffleOptions: (exam.rules as { shuffleOptions?: boolean }).shuffleOptions ?? true,
      hideCorrectAnswers: true,
    }),
  );

  await recordExamIncident({
    institutionId,
    examId: String(exam._id),
    attemptId: String(attempt._id),
    actorId: actor.userId,
    incidentType: 'attempt.reconnected',
    message: 'Student reconnected to exam session',
    metadata: { reconnectCount: (attempt.reconnectCount ?? 0) + 1 },
  });

  return {
    attempt: toDto(updated!),
    questions: rendered,
    answers: answers.map((a) => toDto(a)),
    accessibilityFontSize: attempt.accessibilityFontSize ?? 'default',
    remainingSeconds: examinationEngine.remainingAttemptSeconds(
      {
        activityId: String(exam._id),
        attemptId: String(attempt._id),
        studentId: String(attempt.studentId),
        startedAt: attempt.startedAt!,
        durationMinutes:
          (exam.rules as { durationMinutes: number }).durationMinutes +
          (attempt.extendedDurationMinutes ?? 0),
      },
      new Date(),
    ),
  };
}

export async function heartbeatAttempt(input: HeartbeatExamAttemptInput, actor: ActorContext) {
  const institutionId = actor.institutionId!;
  const attempt = await examinationRepository.findAttemptBySessionToken(
    institutionId,
    input.sessionToken,
  );
  if (!attempt) throw new NotFoundError('Session not found');

  if (!input.connected) {
    const updated = await examinationRepository.updateAttemptById(
      institutionId,
      String(attempt._id),
      {
        status: 'disconnected',
        disconnectedAt: new Date(),
        lastSeenAt: new Date(),
      },
    );
    await recordExamIncident({
      institutionId,
      examId: String(attempt.examId),
      attemptId: String(attempt._id),
      actorId: actor.userId,
      incidentType: 'attempt.disconnected',
      severity: 'warning',
      message: 'Student disconnected from exam session',
    });
    emitAttemptLive(String(attempt._id), 'live.attempt.disconnected', {
      attemptId: String(attempt._id),
      examId: String(attempt.examId),
    });
    emitExamLive(String(attempt.examId), 'live.attempt.disconnected', {
      attemptId: String(attempt._id),
      examId: String(attempt.examId),
    });
    return toDto(updated!);
  }

  const wasDisconnected = attempt.status === 'disconnected';
  const updated = await examinationRepository.updateAttemptById(
    institutionId,
    String(attempt._id),
    { lastSeenAt: new Date(), status: wasDisconnected ? 'started' : attempt.status },
  );
  if (wasDisconnected) {
    emitAttemptLive(String(attempt._id), 'live.student.reconnected', {
      attemptId: String(attempt._id),
      examId: String(attempt.examId),
    });
    emitExamLive(String(attempt.examId), 'live.student.reconnected', {
      attemptId: String(attempt._id),
      examId: String(attempt.examId),
    });
  }
  return toDto(updated!);
}

export { sessionToken };
