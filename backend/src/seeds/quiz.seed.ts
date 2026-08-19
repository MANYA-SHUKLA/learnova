import { Types } from 'mongoose';
import {
  QUIZ_DIFFICULTIES,
  QUIZ_TYPES,
  QUIZ_VISIBILITIES,
  QUESTION_DIFFICULTIES,
  QUESTION_TYPES,
} from '@learnova/constants';
import { QuizModel } from '../models/quiz.model.js';
import { QuizSectionModel } from '../models/quiz-section.model.js';
import { QuestionBankModel } from '../models/question-bank.model.js';
import { QuestionModel } from '../models/question.model.js';
import { QuizAttemptModel } from '../models/quiz-attempt.model.js';
import { QuizAnswerModel } from '../models/quiz-answer.model.js';
import { QuizResultModel } from '../models/quiz-result.model.js';
import { QuizAuditLogModel } from '../models/quiz-audit-log.model.js';
import { generateSlug } from '../services/quiz/quiz.helpers.js';
import { logger } from '../utils/logger/index.js';

const STATUSES = ['draft', 'published', 'archived', 'closed'] as const;
const ATTEMPT_STATUSES = ['started', 'submitted', 'completed', 'expired', 'abandoned'] as const;

const TITLE_PREFIXES = [
  'Weekly Practice Quiz',
  'Module Check',
  'Lesson Review',
  'Midterm Prep',
  'Final Revision',
  'Concept Drill',
  'Quick Assessment',
  'Knowledge Check',
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

function newOptionId(): string {
  return new Types.ObjectId().toHexString();
}

export interface QuizSeedRefs {
  courseIds: string[];
  studentIds: string[];
  userId: string;
}

export interface SeedQuizOptions {
  force?: boolean;
  quizTarget?: number;
  questionTarget?: number;
  attemptTarget?: number;
  questionBankTarget?: number;
}

export interface QuizSeedResult {
  questionBanks: number;
  questions: number;
  quizzes: number;
  sections: number;
  attempts: number;
  answers: number;
  results: number;
  auditLogs: number;
}

export async function seedQuizzes(
  institutionId: string,
  refs: QuizSeedRefs,
  options: SeedQuizOptions = {},
): Promise<QuizSeedResult> {
  const oid = new Types.ObjectId(institutionId);
  const userOid = new Types.ObjectId(refs.userId);
  const quizTarget = options.quizTarget ?? 100;
  const questionTarget = options.questionTarget ?? 5000;
  const attemptTarget = options.attemptTarget ?? 10000;
  const questionBankTarget = options.questionBankTarget ?? 10;

  logger.info(
    { institutionId, quizTarget, questionTarget, attemptTarget },
    'Starting quiz seed',
  );

  const existing = await QuizModel.countDocuments({ institutionId: oid });
  if (existing > 0 && !options.force) {
    if (existing >= quizTarget) {
      logger.info({ existing }, 'Quizzes already exist, skipping seed (set SEED_FORCE=1)');
      return {
        questionBanks: 0,
        questions: existing,
        quizzes: existing,
        sections: 0,
        attempts: 0,
        answers: 0,
        results: 0,
        auditLogs: 0,
      };
    }
    logger.warn({ existing }, 'Partial quiz data found — clearing and reseeding');
  }

  if (existing > 0) {
    await Promise.all([
      QuizModel.deleteMany({ institutionId: oid }),
      QuizSectionModel.deleteMany({ institutionId: oid }),
      QuestionBankModel.deleteMany({ institutionId: oid }),
      QuestionModel.deleteMany({ institutionId: oid }),
      QuizAttemptModel.deleteMany({ institutionId: oid }),
      QuizAnswerModel.deleteMany({ institutionId: oid }),
      QuizResultModel.deleteMany({ institutionId: oid }),
      QuizAuditLogModel.deleteMany({ institutionId: oid }),
    ]);
  }

  const bankDocs = Array.from({ length: questionBankTarget }, (_, i) => ({
    institutionId: oid,
    title: `Seed Question Bank ${String(i + 1)}`,
    slug: `seed-question-bank-${String(i + 1)}`,
    description: 'Auto-generated question bank for quiz seed',
    status: 'active' as const,
    questionCount: 0,
    categoryIds: [],
    tagIds: [],
    createdBy: userOid,
    updatedBy: userOid,
  }));

  const banks = await QuestionBankModel.insertMany(bankDocs);
  const bankIds = banks.map((b) => b._id);

  const questionBatchSize = 500;
  let questionsCreated = 0;
  const allQuestionIds: Types.ObjectId[] = [];

  while (questionsCreated < questionTarget) {
    const batchCount = Math.min(questionBatchSize, questionTarget - questionsCreated);
    const batch = Array.from({ length: batchCount }, (_, i) => {
      const idx = questionsCreated + i;
      const questionType = randomItem(QUESTION_TYPES);
      const options =
        questionType === 'fill_blank' || questionType === 'match_following'
          ? []
          : [
              {
                id: newOptionId(),
                optionText: 'Option A',
                isCorrect: true,
                displayOrder: 0,
                feedback: null,
              },
              {
                id: newOptionId(),
                optionText: 'Option B',
                isCorrect: false,
                displayOrder: 1,
                feedback: null,
              },
            ];

      return {
        institutionId: oid,
        questionBankId: randomItem(bankIds),
        question: `Seed question ${String(idx + 1)}: ${randomItem(TITLE_PREFIXES)}`,
        description: null,
        questionType,
        difficulty: randomItem(QUESTION_DIFFICULTIES),
        marks: randomInt(1, 5),
        negativeMarks: randomBool(0.3) ? 0.25 : 0,
        explanation: { text: 'Review the course material.', mediaUrl: null },
        hint: randomBool(0.4) ? 'Think about the core concept.' : null,
        tags: [`tag-${String(idx % 20)}`],
        category: `category-${String(idx % 10)}`,
        attachments: [],
        options,
        matchPairs: [],
        fillBlankAnswers: questionType === 'fill_blank' ? ['answer'] : [],
        createdBy: userOid,
        updatedBy: userOid,
      };
    });

    const inserted = await QuestionModel.insertMany(batch);
    allQuestionIds.push(...inserted.map((q) => q._id));
    questionsCreated += batch.length;
  }

  for (const bank of banks) {
    const count = await QuestionModel.countDocuments({
      institutionId: oid,
      questionBankId: bank._id,
    });
    await QuestionBankModel.updateOne({ _id: bank._id }, { $set: { questionCount: count } });
  }

  const quizBatchSize = 25;
  let quizzesCreated = 0;
  const quizIds: Types.ObjectId[] = [];
  let sectionsCreated = 0;

  while (quizzesCreated < quizTarget) {
    const batchCount = Math.min(quizBatchSize, quizTarget - quizzesCreated);
    const quizBatch = Array.from({ length: batchCount }, (_, i) => {
      const idx = quizzesCreated + i;
      const title = `${randomItem(TITLE_PREFIXES)} ${String(idx + 1)}`;
      const questionSample = allQuestionIds.slice(
        (idx * 5) % allQuestionIds.length,
        ((idx * 5) % allQuestionIds.length) + randomInt(3, 8),
      );

      return {
        institutionId: oid,
        courseId: new Types.ObjectId(randomItem(refs.courseIds)),
        moduleId: null,
        lessonId: null,
        title,
        slug: `${generateSlug(title)}-${String(idx)}`,
        description: 'Auto-generated quiz for seed data',
        instructions: 'Answer all questions to the best of your ability.',
        visibility: randomItem(QUIZ_VISIBILITIES),
        status: randomItem(STATUSES),
        quizType: randomItem(QUIZ_TYPES),
        difficulty: randomItem(QUIZ_DIFFICULTIES),
        passingMarks: 40,
        totalMarks: 100,
        durationMinutes: randomItem([15, 30, 45, 60]),
        attemptLimit: randomInt(1, 3),
        shuffleQuestions: randomBool(),
        shuffleOptions: randomBool(),
        showResultsImmediately: true,
        showCorrectAnswers: randomBool(),
        allowReview: true,
        negativeMarking: randomBool(0.3),
        negativeMarkValue: 0.25,
        publishDate: randomBool() ? new Date() : null,
        closeDate: randomBool(0.5) ? new Date(Date.now() + 30 * 86400000) : null,
        sectionIds: [],
        questionIds: questionSample,
        createdBy: userOid,
        updatedBy: userOid,
      };
    });

    const insertedQuizzes = await QuizModel.insertMany(quizBatch);
    for (const quiz of insertedQuizzes) {
      quizIds.push(quiz._id);
      const section = await QuizSectionModel.create({
        institutionId: oid,
        quizId: quiz._id,
        title: 'Section A',
        description: null,
        marks: 100,
        questionCount: quiz.questionIds.length,
        randomizeQuestions: false,
        randomQuestionCount: null,
        displayOrder: 0,
        questionIds: quiz.questionIds,
      });
      sectionsCreated += 1;
      await QuizModel.updateOne({ _id: quiz._id }, { $set: { sectionIds: [section._id] } });
    }

    quizzesCreated += batchCount;
  }

  const attemptBatchSize = 500;
  let attemptsCreated = 0;
  let answersCreated = 0;
  let resultsCreated = 0;

  while (attemptsCreated < attemptTarget) {
    const batchCount = Math.min(attemptBatchSize, attemptTarget - attemptsCreated);
    const attemptBatch = Array.from({ length: batchCount }, () => {
      const quiz = quizIds[randomInt(0, quizIds.length - 1)]!;
      const studentId = new Types.ObjectId(randomItem(refs.studentIds));
      const status = randomItem(ATTEMPT_STATUSES);
      const score = randomInt(0, 100);
      const startedAt = new Date(Date.now() - randomInt(1, 60) * 86400000);

      return {
        institutionId: oid,
        quizId: quiz,
        studentId,
        courseId: new Types.ObjectId(randomItem(refs.courseIds)),
        attemptNumber: randomInt(1, 3),
        startedAt,
        submittedAt: status === 'started' ? null : new Date(startedAt.getTime() + 1800000),
        status,
        score,
        percentage: score,
        timeTakenSeconds: randomInt(300, 3600),
        autoSubmitted: randomBool(0.1),
      };
    });

    const insertedAttempts = await QuizAttemptModel.insertMany(attemptBatch);
    attemptsCreated += insertedAttempts.length;

    for (const attempt of insertedAttempts) {
      const quiz = await QuizModel.findById(attempt.quizId).select('questionIds').lean();
      const questionIds = (quiz?.questionIds ?? []).slice(0, 5);

      for (const questionId of questionIds) {
        await QuizAnswerModel.create({
          institutionId: oid,
          attemptId: attempt._id,
          questionId,
          selectedOptionIds: [newOptionId()],
          textAnswer: null,
          matchAnswers: {},
          isCorrect: randomBool(),
          marksAwarded: randomInt(0, 5),
          timeSpentSeconds: randomInt(10, 120),
        });
        answersCreated += 1;
      }

      if (attempt.status === 'completed' || attempt.status === 'submitted') {
        await QuizResultModel.create({
          institutionId: oid,
          attemptId: attempt._id,
          quizId: attempt.quizId,
          studentId: attempt.studentId,
          totalQuestions: questionIds.length,
          correct: randomInt(0, questionIds.length),
          incorrect: randomInt(0, questionIds.length),
          skipped: 0,
          score: attempt.score,
          percentage: attempt.percentage,
          passed: attempt.score >= 40,
          rank: null,
        });
        resultsCreated += 1;
      }
    }
  }

  const auditLogs = await QuizAuditLogModel.insertMany(
    quizIds.slice(0, 50).map((quizId) => ({
      institutionId: oid,
      quizId,
      questionId: null,
      attemptId: null,
      courseId: null,
      userId: userOid,
      email: null,
      event: 'quiz.created',
      metadata: { source: 'seed' },
    })),
  );

  logger.info(
    {
      questionBanks: banks.length,
      questions: questionsCreated,
      quizzes: quizzesCreated,
      sections: sectionsCreated,
      attempts: attemptsCreated,
      answers: answersCreated,
      results: resultsCreated,
      auditLogs: auditLogs.length,
    },
    'Quiz seed completed',
  );

  return {
    questionBanks: banks.length,
    questions: questionsCreated,
    quizzes: quizzesCreated,
    sections: sectionsCreated,
    attempts: attemptsCreated,
    answers: answersCreated,
    results: resultsCreated,
    auditLogs: auditLogs.length,
  };
}
