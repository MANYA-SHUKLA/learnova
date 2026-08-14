import { Types } from 'mongoose';
import {
  JUDGE0_LANGUAGE_IDS,
  PRACTICE_DIFFICULTIES,
  PRACTICE_LANGUAGE_META,
  PRACTICE_LANGUAGES,
} from '@learnova/constants';
import { PracticeLabModel } from '../models/practice-lab.model.js';
import { LabProblemModel } from '../models/lab-problem.model.js';
import { ProblemTestCaseModel } from '../models/problem-test-case.model.js';
import { StudentCodeSubmissionModel } from '../models/student-code-submission.model.js';
import { ExecutionHistoryModel } from '../models/execution-history.model.js';
import { LabProgressModel } from '../models/lab-progress.model.js';
import { LanguageModel } from '../models/language.model.js';
import { PracticeLabAuditLogModel } from '../models/practice-lab-audit-log.model.js';
import { logger } from '../utils/logger/index.js';
import { defaultBoilerplates, slugifyProblemTitle } from '../services/practice-lab/practice-lab.helpers.js';

const LAB_TITLES = [
  'Intro Programming Lab',
  'Arrays & Strings',
  'Recursion Workshop',
  'Sorting Practice',
  'Searching Drills',
  'Hash Maps Lab',
  'Linked Lists',
  'Trees Basics',
  'Graph Traversal',
  'Dynamic Programming I',
  'Dynamic Programming II',
  'Greedy Algorithms',
  'Bit Manipulation',
  'Math & Number Theory',
  'Two Pointers',
  'Sliding Window',
  'Stack & Queue',
  'Heap Practice',
  'Backtracking Lab',
  'Concurrency Basics',
  'I/O Intensive',
  'String Algorithms',
  'Matrix Problems',
  'Prefix Sums',
  'Binary Search Lab',
  'Union Find',
  'Segment Trees Intro',
  'Competitive Warmup',
  'Interview Prep Easy',
  'Interview Prep Medium',
];

const PROBLEM_TEMPLATES = [
  {
    title: 'Sum of Two Numbers',
    statement: 'Read two integers A and B and print their sum.',
    sampleIn: '2 3',
    sampleOut: '5',
    tags: ['math', 'basics'],
  },
  {
    title: 'Echo Input',
    statement: 'Read a line and print it unchanged.',
    sampleIn: 'hello world',
    sampleOut: 'hello world',
    tags: ['io', 'basics'],
  },
  {
    title: 'Maximum of Three',
    statement: 'Read three integers and print the maximum.',
    sampleIn: '4 9 2',
    sampleOut: '9',
    tags: ['math', 'conditionals'],
  },
  {
    title: 'Count Vowels',
    statement: 'Count vowels in a lowercase string.',
    sampleIn: 'education',
    sampleOut: '5',
    tags: ['strings'],
  },
  {
    title: 'Palindrome Check',
    statement: 'Print YES if the string is a palindrome, otherwise NO.',
    sampleIn: 'radar',
    sampleOut: 'YES',
    tags: ['strings'],
  },
];

function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export interface PracticeLabSeedRefs {
  courseIds: string[];
  studentIds: string[];
  userId: string;
}

export interface SeedPracticeLabOptions {
  force?: boolean;
  labTarget?: number;
  problemTarget?: number;
  testCaseTarget?: number;
  submissionTarget?: number;
  /** When true, every seeded lab is published (recommended for demo/bootstrap). */
  publishAll?: boolean;
}

export interface PracticeLabSeedResult {
  languages: number;
  labs: number;
  problems: number;
  testCases: number;
  submissions: number;
  executions: number;
  progress: number;
}

export async function seedPracticeLabs(
  institutionId: string,
  refs: PracticeLabSeedRefs,
  options: SeedPracticeLabOptions = {},
): Promise<PracticeLabSeedResult> {
  const oid = new Types.ObjectId(institutionId);
  const labTarget = options.labTarget ?? 30;
  const problemTarget = options.problemTarget ?? 300;
  const testCaseTarget = options.testCaseTarget ?? 5000;
  const submissionTarget = options.submissionTarget ?? 10_000;

  const existing = await PracticeLabModel.countDocuments({ institutionId: oid, deletedAt: null });
  if (existing > 0 && !options.force) {
    logger.info({ existing }, 'Practice labs already seeded — skipping (set SEED_FORCE=1 to replace)');
    return {
      languages: await LanguageModel.countDocuments(),
      labs: existing,
      problems: await LabProblemModel.countDocuments({ institutionId: oid, deletedAt: null }),
      testCases: await ProblemTestCaseModel.countDocuments({ institutionId: oid, deletedAt: null }),
      submissions: await StudentCodeSubmissionModel.countDocuments({
        institutionId: oid,
        deletedAt: null,
      }),
      executions: await ExecutionHistoryModel.countDocuments({ institutionId: oid }),
      progress: await LabProgressModel.countDocuments({ institutionId: oid }),
    };
  }

  if (options.force) {
    await Promise.all([
      PracticeLabModel.deleteMany({ institutionId: oid }),
      LabProblemModel.deleteMany({ institutionId: oid }),
      ProblemTestCaseModel.deleteMany({ institutionId: oid }),
      StudentCodeSubmissionModel.deleteMany({ institutionId: oid }),
      ExecutionHistoryModel.deleteMany({ institutionId: oid }),
      LabProgressModel.deleteMany({ institutionId: oid }),
      PracticeLabAuditLogModel.deleteMany({ institutionId: oid }),
    ]);
  }

  for (const [order, key] of PRACTICE_LANGUAGES.entries()) {
    await LanguageModel.findOneAndUpdate(
      { key },
      {
        $set: {
          key,
          name: PRACTICE_LANGUAGE_META[key].name,
          judge0Id: JUDGE0_LANGUAGE_IDS[key],
          monacoLanguage: PRACTICE_LANGUAGE_META[key].monacoLanguage,
          version: PRACTICE_LANGUAGE_META[key].version,
          enabled: true,
          order,
        },
      },
      { upsert: true },
    );
  }

  const labs = [];
  for (let i = 0; i < labTarget; i++) {
    const courseId = randomItem(refs.courseIds);
    const languages = [...PRACTICE_LANGUAGES].slice(0, randomInt(3, 6));
    labs.push({
      institutionId: oid,
      courseId: new Types.ObjectId(courseId),
      title: `${LAB_TITLES[i % LAB_TITLES.length]}${i >= LAB_TITLES.length ? ` ${i + 1}` : ''}`,
      description: `Seeded practice lab #${i + 1} for coding practice.`,
      visibility: 'enrolled',
      status: options.publishAll || (options.labTarget ?? 30) <= 10 ? 'published' : i % 5 === 0 ? 'draft' : 'published',
      difficulty: randomItem(PRACTICE_DIFFICULTIES),
      estimatedMinutes: randomInt(30, 180),
      languages,
      allowRun: true,
      allowSubmit: true,
      maxSubmissions: 50,
      problemCount: 0,
      createdBy: new Types.ObjectId(refs.userId),
      updatedBy: new Types.ObjectId(refs.userId),
    });
  }
  const labDocs = await PracticeLabModel.insertMany(labs);

  const problemsPerLab = Math.ceil(problemTarget / labDocs.length);
  const problemDocs = [];
  let problemIndex = 0;

  for (const lab of labDocs) {
    const count = Math.min(problemsPerLab, problemTarget - problemDocs.length);
    for (let p = 0; p < count; p++) {
      const tpl = PROBLEM_TEMPLATES[problemIndex % PROBLEM_TEMPLATES.length]!;
      const title = `${tpl.title} ${problemIndex + 1}`;
      const languages = (lab.languages as typeof PRACTICE_LANGUAGES[number][]) ?? ['python'];
      problemDocs.push({
        institutionId: oid,
        practiceLabId: lab._id,
        title,
        slug: `${slugifyProblemTitle(title)}-${String(lab._id).slice(-4)}-${p}`,
        description: tpl.title,
        problemStatement: tpl.statement,
        inputFormat: 'Single line input as described.',
        outputFormat: 'Print the answer on a single line.',
        constraints: '1 <= |input| <= 1000',
        sampleInput: tpl.sampleIn,
        sampleOutput: tpl.sampleOut,
        explanation: 'Seeded sample explanation.',
        difficulty: randomItem(PRACTICE_DIFFICULTIES),
        tags: tpl.tags,
        memoryLimitMB: 256,
        timeLimitMS: 2000,
        allowedLanguages: languages,
        boilerplates: defaultBoilerplates(languages),
        solutionCode: null,
        editorial: null,
        order: p,
        createdBy: new Types.ObjectId(refs.userId),
        updatedBy: new Types.ObjectId(refs.userId),
      });
      problemIndex++;
    }
  }

  const createdProblems = await LabProblemModel.insertMany(problemDocs);
  const problemsByLab = new Map<string, number>();
  for (const p of createdProblems) {
    const key = String(p.practiceLabId);
    problemsByLab.set(key, (problemsByLab.get(key) ?? 0) + 1);
  }
  for (const [labId, count] of problemsByLab) {
    await PracticeLabModel.updateOne({ _id: labId }, { $set: { problemCount: count } });
  }

  const casesPerProblem = Math.max(1, Math.ceil(testCaseTarget / createdProblems.length));
  const testCases = [];
  for (const problem of createdProblems) {
    const sampleIn = problem.sampleInput ?? '1';
    const sampleOut = problem.sampleOutput ?? '1';
    for (let t = 0; t < casesPerProblem && testCases.length < testCaseTarget; t++) {
      const visibility = t === 0 ? 'public' : 'hidden';
      testCases.push({
        institutionId: oid,
        practiceLabId: problem.practiceLabId,
        problemId: problem._id,
        input: sampleIn,
        expectedOutput: sampleOut,
        visibility,
        weight: visibility === 'public' ? 1 : 2,
        timeoutMS: 2000,
        memoryLimitMB: 256,
        order: t,
      });
    }
  }
  await ProblemTestCaseModel.insertMany(testCases, { ordered: false });

  const verdicts = [
    'accepted',
    'wrong_answer',
    'compilation_error',
    'runtime_error',
    'partial',
  ] as const;
  const submissions = [];
  const executions = [];
  for (let i = 0; i < submissionTarget; i++) {
    const problem = randomItem(createdProblems);
    const studentId = randomItem(refs.studentIds);
    const language = randomItem(problem.allowedLanguages as typeof PRACTICE_LANGUAGES[number][]);
    const verdict = randomItem(verdicts);
    const score = verdict === 'accepted' ? 10 : randomInt(0, 8);
    submissions.push({
      institutionId: oid,
      practiceLabId: problem.practiceLabId,
      problemId: problem._id,
      studentId: new Types.ObjectId(studentId),
      language,
      sourceCode: PRACTICE_LANGUAGE_META[language].defaultBoilerplate,
      verdict,
      score,
      maxScore: 10,
      passedCount: verdict === 'accepted' ? 5 : randomInt(0, 4),
      totalCount: 5,
      attemptNumber: randomInt(1, 5),
      executionTimeMS: randomInt(5, 800),
      memoryKB: randomInt(800, 40_000),
      compileOutput: verdict === 'compilation_error' ? 'error: seed compile fail' : null,
      results: [],
    });

    if (i < Math.min(submissionTarget, 5000)) {
      executions.push({
        institutionId: oid,
        practiceLabId: problem.practiceLabId,
        problemId: problem._id,
        studentId: new Types.ObjectId(studentId),
        language,
        sourceCode: PRACTICE_LANGUAGE_META[language].defaultBoilerplate,
        stdin: problem.sampleInput,
        stdout: problem.sampleOutput,
        stderr: null,
        compileOutput: null,
        status: verdict === 'accepted' ? 'accepted' : 'wrong_answer',
        exitCode: 0,
        executionTimeMS: randomInt(5, 500),
        memoryKB: randomInt(800, 20_000),
        isSubmission: true,
      });
    }
  }

  const BATCH = 1000;
  for (let i = 0; i < submissions.length; i += BATCH) {
    await StudentCodeSubmissionModel.insertMany(submissions.slice(i, i + BATCH), {
      ordered: false,
    });
  }
  for (let i = 0; i < executions.length; i += BATCH) {
    await ExecutionHistoryModel.insertMany(executions.slice(i, i + BATCH), { ordered: false });
  }

  const progressDocs = [];
  for (const lab of labDocs.slice(0, 20)) {
    for (const studentId of refs.studentIds.slice(0, 20)) {
      const attempts = randomInt(1, 40);
      const accepted = randomInt(0, attempts);
      progressDocs.push({
        institutionId: oid,
        practiceLabId: lab._id,
        studentId: new Types.ObjectId(studentId),
        problemsSolved: randomInt(0, lab.problemCount || 5),
        totalProblems: lab.problemCount || 10,
        attempts,
        accepted,
        wrongAnswers: Math.max(0, attempts - accepted),
        runtimeErrors: randomInt(0, 3),
        compilationErrors: randomInt(0, 3),
        timeSpentSeconds: randomInt(60, 20_000),
        successRate: attempts ? Math.round((accepted / attempts) * 1000) / 10 : 0,
        streakDays: randomInt(0, 14),
        lastSolvedAt: new Date(),
        completedAt: null,
      });
    }
  }
  if (progressDocs.length) {
    await LabProgressModel.insertMany(progressDocs, { ordered: false });
  }

  const result = {
    languages: PRACTICE_LANGUAGES.length,
    labs: labDocs.length,
    problems: createdProblems.length,
    testCases: testCases.length,
    submissions: submissions.length,
    executions: executions.length,
    progress: progressDocs.length,
  };
  logger.info(result, 'Practice lab seed inserted');
  return result;
}

/** Align seeded test cases with each problem's sample I/O (fixes legacy template-index mismatch). */
export async function repairPracticeLabTestCases(institutionId: string): Promise<number> {
  const oid = new Types.ObjectId(institutionId);
  const problems = await LabProblemModel.find({
    institutionId: oid,
    deletedAt: null,
    sampleInput: { $ne: null },
    sampleOutput: { $ne: null },
  })
    .select('_id sampleInput sampleOutput')
    .lean();

  let modified = 0;
  for (const problem of problems) {
    const result = await ProblemTestCaseModel.updateMany(
      { institutionId: oid, problemId: problem._id, deletedAt: null },
      {
        $set: {
          input: problem.sampleInput,
          expectedOutput: problem.sampleOutput,
        },
      },
    );
    modified += result.modifiedCount;
  }
  return modified;
}
