import { Types } from 'mongoose';
import { EXAM_STATUSES, EXAM_TYPES } from '@learnova/constants';
import { ExamModel } from '../models/exam.model.js';
import { ExamSectionModel } from '../models/exam-section.model.js';
import { ExamAttemptModel } from '../models/exam-attempt.model.js';
import { ExamAnswerModel } from '../models/exam-answer.model.js';
import { ExamResultModel } from '../models/exam-result.model.js';
import { ExamSeatingModel } from '../models/exam-seating.model.js';
import { ExamProctorSessionModel } from '../models/exam-proctor-session.model.js';
import { ExamProctorEventModel } from '../models/exam-proctor-event.model.js';
import { ExamAuditLogModel } from '../models/exam-audit-log.model.js';
import { QuestionModel } from '../models/question.model.js';
import { generateSlug } from '../services/examination/examination.helpers.js';
import { logger } from '../utils/logger/index.js';

const ATTEMPT_STATUSES = [
  'scheduled',
  'checked_in',
  'started',
  'submitted',
  'completed',
  'expired',
  'terminated',
] as const;

const TITLE_PREFIXES = [
  'Midterm Examination',
  'Final Examination',
  'Internal Assessment',
  'Practical Exam',
  'Viva Voce',
  'End Semester Exam',
];

function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomBool(probability = 0.5): boolean {
  return Math.random() < probability;
}

export interface ExaminationSeedRefs {
  courseIds: string[];
  studentIds: string[];
  userId: string;
}

export interface SeedExaminationOptions {
  force?: boolean;
  examTarget?: number;
  attemptTarget?: number;
}

export interface ExaminationSeedResult {
  exams: number;
  sections: number;
  attempts: number;
  answers: number;
  results: number;
  seating: number;
  proctorSessions: number;
  auditLogs: number;
}

export async function seedExaminations(
  institutionId: string,
  refs: ExaminationSeedRefs,
  options: SeedExaminationOptions = {},
): Promise<ExaminationSeedResult> {
  const oid = new Types.ObjectId(institutionId);
  const userOid = new Types.ObjectId(refs.userId);
  const examTarget = options.examTarget ?? 20;
  const attemptTarget = options.attemptTarget ?? 500;

  logger.info({ institutionId, examTarget, attemptTarget }, 'Starting examination seed');

  const existing = await ExamModel.countDocuments({ institutionId: oid });
  if (existing > 0 && !options.force) {
    if (existing >= examTarget) {
      logger.info({ existing }, 'Exams already exist, skipping seed (set SEED_FORCE=1)');
      return {
        exams: existing,
        sections: 0,
        attempts: 0,
        answers: 0,
        results: 0,
        seating: 0,
        proctorSessions: 0,
        auditLogs: 0,
      };
    }
    logger.warn({ existing }, 'Partial exam data found — clearing and reseeding');
  }

  if (existing > 0) {
    await Promise.all([
      ExamModel.deleteMany({ institutionId: oid }),
      ExamSectionModel.deleteMany({ institutionId: oid }),
      ExamAttemptModel.deleteMany({ institutionId: oid }),
      ExamAnswerModel.deleteMany({ institutionId: oid }),
      ExamResultModel.deleteMany({ institutionId: oid }),
      ExamSeatingModel.deleteMany({ institutionId: oid }),
      ExamProctorSessionModel.deleteMany({ institutionId: oid }),
      ExamProctorEventModel.deleteMany({ institutionId: oid }),
      ExamAuditLogModel.deleteMany({ institutionId: oid }),
    ]);
  }

  const existingQuestions = await QuestionModel.find({ institutionId: oid, deletedAt: null })
    .select('_id marks')
    .limit(200)
    .exec();

  if (existingQuestions.length === 0) {
    throw new Error(
      'No questions found for institution. Run seed:quizzes first to populate the question bank.',
    );
  }

  const questionIds = existingQuestions.map((q) => q._id);
  const now = Date.now();
  const examDocs = [];

  for (let i = 0; i < examTarget; i++) {
    const courseId = new Types.ObjectId(randomItem(refs.courseIds));
    const title = `${randomItem(TITLE_PREFIXES)} ${String(i + 1)}`;
    const startsAt = new Date(now + (i - 10) * 24 * 60 * 60 * 1000);
    const endsAt = new Date(startsAt.getTime() + 3 * 60 * 60 * 1000);
    const status = randomItem(EXAM_STATUSES.filter((s) => s !== 'cancelled'));
    const selectedQuestions = questionIds
      .sort(() => Math.random() - 0.5)
      .slice(0, randomInt(5, 15));

    examDocs.push({
      institutionId: oid,
      courseId,
      moduleId: null,
      lessonId: null,
      title,
      slug: `${generateSlug(title)}-${String(i + 1)}`,
      description: `Seed examination ${String(i + 1)}`,
      instructions: 'Answer all questions. No external resources allowed.',
      examType: randomItem(EXAM_TYPES),
      visibility: 'enrolled',
      status,
      schedule: {
        registrationOpensAt: new Date(startsAt.getTime() - 7 * 24 * 60 * 60 * 1000),
        registrationClosesAt: new Date(startsAt.getTime() - 60 * 60 * 1000),
        checkInOpensAt: new Date(startsAt.getTime() - 30 * 60 * 1000),
        startsAt,
        endsAt,
        lateEntryMinutes: 15,
        gracePeriodMinutes: 5,
      },
      proctoring: {
        mode: randomBool(0.6) ? 'live' : 'none',
        secureBrowser: randomItem(['off', 'recommended', 'required'] as const),
        requireWebcam: randomBool(0.4),
        requireMicrophone: false,
        blockCopyPaste: true,
        blockRightClick: true,
        blockNewTabs: true,
        requireFullscreen: true,
        maxTabSwitches: 3,
        autoTerminateOnViolation: randomBool(0.3),
        invigilatorIds: [],
      },
      rules: {
        passingMarks: 40,
        totalMarks: 100,
        durationMinutes: 120,
        attemptLimit: 1,
        negativeMarking: randomBool(0.3),
        negativeMarkValue: 0.25,
        shuffleQuestions: true,
        shuffleOptions: true,
        showResultsAfter: randomItem(['immediate', 'schedule_end', 'manual_release'] as const),
        allowReview: false,
        showCorrectAnswers: false,
      },
      sectionIds: [],
      questionIds: selectedQuestions,
      seatingEnabled: randomBool(0.4),
      createdBy: userOid,
      updatedBy: userOid,
    });
  }

  const exams = await ExamModel.insertMany(examDocs);
  let sectionsCreated = 0;

  for (const exam of exams) {
    const sectionQuestions = exam.questionIds.slice(0, Math.ceil(exam.questionIds.length / 2));
    const section = await ExamSectionModel.create({
      institutionId: oid,
      examId: exam._id,
      title: 'Section A',
      description: null,
      marks: 50,
      questionCount: sectionQuestions.length,
      randomizeQuestions: true,
      randomQuestionCount: null,
      displayOrder: 0,
      questionIds: sectionQuestions,
    });
    await ExamModel.updateOne({ _id: exam._id }, { $set: { sectionIds: [section._id] } });
    sectionsCreated += 1;
  }

  let attemptsCreated = 0;
  let answersCreated = 0;
  let resultsCreated = 0;
  let seatingCreated = 0;
  let proctorSessionsCreated = 0;

  while (attemptsCreated < attemptTarget) {
    const exam = randomItem(exams);
    const studentId = new Types.ObjectId(randomItem(refs.studentIds));
    const status = randomItem(ATTEMPT_STATUSES);
    const startedAt =
      status === 'started' || status === 'completed' || status === 'submitted'
        ? new Date(exam.schedule.startsAt.getTime() + randomInt(0, 60) * 60 * 1000)
        : null;

    const attempt = await ExamAttemptModel.create({
      institutionId: oid,
      examId: exam._id,
      studentId,
      courseId: exam.courseId,
      attemptNumber: 1,
      scheduledAt: exam.schedule.startsAt,
      checkedInAt: status !== 'scheduled' ? exam.schedule.startsAt : null,
      startedAt,
      submittedAt:
        status === 'completed' || status === 'submitted'
          ? new Date((startedAt ?? exam.schedule.startsAt).getTime() + 90 * 60 * 1000)
          : null,
      status,
      score: status === 'completed' ? randomInt(20, 95) : 0,
      percentage: status === 'completed' ? randomInt(20, 95) : 0,
      timeTakenSeconds: status === 'completed' ? randomInt(3600, 7200) : 0,
      autoSubmitted: false,
      violationCount: randomInt(0, 2),
      terminatedReason: status === 'terminated' ? 'Tab switch limit exceeded' : null,
    });
    attemptsCreated += 1;

    if (exam.seatingEnabled && randomBool(0.7)) {
      await ExamSeatingModel.create({
        institutionId: oid,
        examId: exam._id,
        studentId,
        seatNumber: `S${String(randomInt(1, 100)).padStart(3, '0')}`,
        room: `Hall ${String(randomInt(1, 5))}`,
        row: String(randomInt(1, 10)),
        column: String(randomInt(1, 8)),
        checkedInAt: attempt.checkedInAt,
      });
      seatingCreated += 1;
    }

    if (status === 'completed' || status === 'submitted') {
      const examQuestions = await QuestionModel.find({
        _id: { $in: exam.questionIds.slice(0, 5) },
      }).exec();

      for (const q of examQuestions) {
        const isCorrect = randomBool(0.6);
        await ExamAnswerModel.create({
          institutionId: oid,
          attemptId: attempt._id,
          questionId: q._id,
          selectedOptionIds: [],
          textAnswer: isCorrect ? 'seed answer' : 'wrong',
          matchAnswers: {},
          isCorrect,
          marksAwarded: isCorrect ? q.marks : 0,
          timeSpentSeconds: randomInt(30, 300),
        });
        answersCreated += 1;
      }

      await ExamResultModel.create({
        institutionId: oid,
        attemptId: attempt._id,
        examId: exam._id,
        studentId,
        totalQuestions: examQuestions.length,
        correct: randomInt(1, examQuestions.length),
        incorrect: randomInt(0, 2),
        skipped: 0,
        score: attempt.score,
        percentage: attempt.percentage,
        passed: attempt.percentage >= exam.rules.passingMarks,
        rank: null,
        releasedAt: exam.rules.showResultsAfter === 'immediate' ? attempt.submittedAt : null,
      });
      resultsCreated += 1;
    }

    if (exam.proctoring.mode !== 'none' && status === 'started' && randomBool(0.3)) {
      await ExamProctorSessionModel.create({
        institutionId: oid,
        examId: exam._id,
        attemptId: attempt._id,
        proctorId: userOid,
        startedAt: startedAt ?? new Date(),
        endedAt: null,
        status: 'active',
        notes: null,
      });
      proctorSessionsCreated += 1;
    }
  }

  await ExamAuditLogModel.insertMany(
    Array.from({ length: 20 }, (_, i) => ({
      institutionId: oid,
      examId: randomItem(exams)._id,
      attemptId: null,
      courseId: null,
      userId: userOid,
      email: 'seed@learnova.test',
      event: randomItem(['exam.created', 'exam.published', 'exam.scheduled'] as const),
      metadata: { seedIndex: i },
    })),
  );

  const result: ExaminationSeedResult = {
    exams: exams.length,
    sections: sectionsCreated,
    attempts: attemptsCreated,
    answers: answersCreated,
    results: resultsCreated,
    seating: seatingCreated,
    proctorSessions: proctorSessionsCreated,
    auditLogs: 20,
  };

  logger.info(result, 'Examination seed completed');
  return result;
}
