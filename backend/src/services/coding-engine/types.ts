import type {
  ExecutionStatus,
  PracticeLanguage,
  SubmissionVerdict,
  TestCaseVisibility,
} from '@learnova/types';

/**
 * Coding Assessment Engine contracts.
 *
 * Practice Labs (Step 10) and Coding Exams (later) both consume this engine.
 * Modules must NOT implement a second Judge0 / Docker runner.
 */

/** Product surface that uses the coding engine */
export type CodingActivityKind = 'lab' | 'exam' | 'contest';

export interface CodingActivityRef {
  kind: CodingActivityKind;
  /** Practice lab id, exam id, etc. */
  activityId: string | null;
  problemId: string | null;
}

export interface CodingEngineTestCase {
  id: string;
  input: string;
  expectedOutput: string;
  visibility: TestCaseVisibility;
  weight: number;
  timeoutMS?: number | null;
  memoryLimitMB?: number | null;
}

export interface CodingRunInput {
  institutionId: string;
  studentId: string;
  language: PracticeLanguage;
  sourceCode: string;
  stdin?: string | null;
  timeLimitMS?: number;
  memoryLimitMB?: number;
  activity: CodingActivityRef;
}

export interface CodingRunResult {
  executionId: string;
  status: ExecutionStatus;
  stdout: string | null;
  stderr: string | null;
  compileOutput: string | null;
  executionTimeMS: number | null;
  memoryKB: number | null;
  exitCode: number | null;
  judge0Token: string | null;
}

export interface CodingEvaluateInput {
  institutionId: string;
  studentId: string;
  language: PracticeLanguage;
  sourceCode: string;
  timeLimitMS: number;
  memoryLimitMB: number;
  testCases: CodingEngineTestCase[];
  activity: CodingActivityRef;
  /** When set, engine updates this pending submission after scoring */
  submissionId?: string | null;
  /** Stop evaluating remaining cases after first compilation error (default true) */
  stopOnCompileError?: boolean;
}

export interface CodingCaseResult {
  testCaseId: string;
  visibility: TestCaseVisibility;
  status: ExecutionStatus;
  stdout: string | null;
  stderr: string | null;
  expectedOutput: string | null;
  executionTimeMS: number | null;
  memoryKB: number | null;
  weight: number;
  passed: boolean;
}

export interface CodingEvaluateResult {
  verdict: SubmissionVerdict;
  score: number;
  maxScore: number;
  passedCount: number;
  totalCount: number;
  compileOutput: string | null;
  executionTimeMS: number | null;
  memoryKB: number | null;
  results: CodingCaseResult[];
  executionId: string | null;
}

export interface CodingSubmissionCreateInput {
  institutionId: string;
  studentId: string;
  language: PracticeLanguage;
  sourceCode: string;
  activity: CodingActivityRef;
  attemptNumber: number;
  maxScore: number;
  totalCount: number;
}

export interface CodingSubmissionRecord {
  id: string;
  verdict: SubmissionVerdict;
  score: number;
  maxScore: number;
  passedCount: number;
  totalCount: number;
  attemptNumber: number;
  executionTimeMS: number | null;
  memoryKB: number | null;
  compileOutput: string | null;
  results: CodingCaseResult[];
  sourceCode: string;
  language: PracticeLanguage;
  studentId: string;
  institutionId: string;
  practiceLabId?: string | null;
  problemId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Pluggable persistence — Practice Labs and Exams provide adapters.
 * The engine never assumes a single Mongo collection shape beyond these methods.
 */
export interface CodingEngineStorage {
  createExecution(data: {
    institutionId: string;
    studentId: string;
    language: PracticeLanguage;
    sourceCode: string;
    stdin?: string | null;
    status: ExecutionStatus;
    isSubmission: boolean;
    activity: CodingActivityRef;
    submissionId?: string | null;
    stdout?: string | null;
    stderr?: string | null;
    compileOutput?: string | null;
    exitCode?: number | null;
    executionTimeMS?: number | null;
    memoryKB?: number | null;
    judge0Token?: string | null;
  }): Promise<{ id: string }>;

  updateExecution(
    id: string,
    data: Partial<{
      status: ExecutionStatus;
      stdout: string | null;
      stderr: string | null;
      compileOutput: string | null;
      exitCode: number | null;
      executionTimeMS: number | null;
      memoryKB: number | null;
      judge0Token: string | null;
      submissionId: string | null;
    }>,
  ): Promise<void>;

  createSubmission?(data: CodingSubmissionCreateInput): Promise<{ id: string }>;

  updateSubmission?(
    id: string,
    data: {
      verdict: SubmissionVerdict;
      score: number;
      maxScore: number;
      passedCount: number;
      totalCount: number;
      executionTimeMS: number | null;
      memoryKB: number | null;
      compileOutput: string | null;
      results: CodingCaseResult[];
    },
  ): Promise<CodingSubmissionRecord | null>;
}

export type CodingStatusEmitter = (payload: {
  room: string;
  executionId: string;
  submissionId?: string | null;
  status: string;
  queuePosition?: number | null;
}) => void;
