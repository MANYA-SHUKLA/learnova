import type { ID } from '../common/index.js';
import type {
  AssessmentLifecycleStatus,
  AssessmentVisibility,
} from '../assessment/index.js';

/** Programming languages supported by Practice Labs / Judge0 */
export type PracticeLanguage =
  | 'c'
  | 'cpp'
  | 'java'
  | 'python'
  | 'javascript'
  | 'typescript'
  | 'go'
  | 'rust'
  | 'csharp'
  | 'kotlin';

export type PracticeDifficulty = 'easy' | 'medium' | 'hard';

export type PracticeLabStatus = AssessmentLifecycleStatus;

export type PracticeLabVisibility = AssessmentVisibility;

export type TestCaseVisibility = 'public' | 'hidden';

export type ExecutionStatus =
  | 'queued'
  | 'running'
  | 'accepted'
  | 'wrong_answer'
  | 'compilation_error'
  | 'runtime_error'
  | 'time_limit_exceeded'
  | 'memory_limit_exceeded'
  | 'internal_error'
  | 'cancelled';

export type SubmissionVerdict =
  | 'pending'
  | 'accepted'
  | 'wrong_answer'
  | 'compilation_error'
  | 'runtime_error'
  | 'time_limit_exceeded'
  | 'memory_limit_exceeded'
  | 'partial'
  | 'failed';

export interface LanguageBoilerplate {
  language: PracticeLanguage;
  code: string;
}

export interface PracticeLab {
  id: ID;
  institutionId: ID;
  courseId: ID;
  moduleId: ID | null;
  lessonId: ID | null;
  title: string;
  description: string | null;
  visibility: PracticeLabVisibility;
  status: PracticeLabStatus;
  difficulty: PracticeDifficulty;
  estimatedMinutes: number | null;
  languages: PracticeLanguage[];
  allowRun: boolean;
  allowSubmit: boolean;
  maxSubmissions: number;
  problemCount: number;
  createdBy: ID | null;
  updatedBy: ID | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface LabProblem {
  id: ID;
  institutionId: ID;
  practiceLabId: ID;
  title: string;
  slug: string;
  description: string | null;
  problemStatement: string;
  inputFormat: string | null;
  outputFormat: string | null;
  constraints: string | null;
  sampleInput: string | null;
  sampleOutput: string | null;
  explanation: string | null;
  difficulty: PracticeDifficulty;
  tags: string[];
  memoryLimitMB: number;
  timeLimitMS: number;
  allowedLanguages: PracticeLanguage[];
  boilerplates: LanguageBoilerplate[];
  /** Present only for faculty/institution — never exposed to students */
  solutionCode: string | null;
  editorial: string | null;
  order: number;
  createdBy: ID | null;
  updatedBy: ID | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ProblemTestCase {
  id: ID;
  institutionId: ID;
  practiceLabId: ID;
  problemId: ID;
  input: string;
  expectedOutput: string;
  visibility: TestCaseVisibility;
  weight: number;
  timeoutMS: number | null;
  memoryLimitMB: number | null;
  order: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface TestCaseResult {
  testCaseId: ID;
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

export interface StudentSubmission {
  id: ID;
  institutionId: ID;
  practiceLabId: ID;
  problemId: ID;
  studentId: ID;
  language: PracticeLanguage;
  sourceCode: string;
  verdict: SubmissionVerdict;
  score: number;
  maxScore: number;
  passedCount: number;
  totalCount: number;
  attemptNumber: number;
  executionTimeMS: number | null;
  memoryKB: number | null;
  compileOutput: string | null;
  results: TestCaseResult[];
  judge0Token: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExecutionHistory {
  id: ID;
  institutionId: ID;
  practiceLabId: ID | null;
  problemId: ID | null;
  studentId: ID;
  language: PracticeLanguage;
  sourceCode: string;
  stdin: string | null;
  stdout: string | null;
  stderr: string | null;
  compileOutput: string | null;
  status: ExecutionStatus;
  exitCode: number | null;
  executionTimeMS: number | null;
  memoryKB: number | null;
  submissionId: ID | null;
  isSubmission: boolean;
  judge0Token: string | null;
  createdAt: string;
}

export interface LanguageCatalogEntry {
  id: ID;
  key: PracticeLanguage;
  name: string;
  judge0Id: number;
  monacoLanguage: string;
  version: string | null;
  enabled: boolean;
  order: number;
}

export interface LabProgress {
  id: ID;
  institutionId: ID;
  practiceLabId: ID;
  studentId: ID;
  problemsSolved: number;
  totalProblems: number;
  attempts: number;
  accepted: number;
  wrongAnswers: number;
  runtimeErrors: number;
  compilationErrors: number;
  timeSpentSeconds: number;
  successRate: number;
  streakDays: number;
  lastSolvedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProblemProgress {
  problemId: ID;
  practiceLabId: ID;
  solved: boolean;
  attempts: number;
  bestScore: number;
  bestVerdict: SubmissionVerdict | null;
  lastAttemptAt: string | null;
}

export interface LeaderboardEntry {
  rank: number;
  studentId: ID;
  displayName: string;
  solvedCount: number;
  attempts: number;
  accuracy: number;
  totalTimeMS: number;
  score: number;
}

export interface PracticeLabStats {
  totalLabs: number;
  totalProblems: number;
  executionsToday: number;
  acceptedRate: number;
  languagesUsed: { language: PracticeLanguage; count: number }[];
  topCourses: { courseId: ID; title: string; labs: number }[];
  mostSolvedProblems: { problemId: ID; title: string; solvedCount: number }[];
}

export interface FacultyPracticeLabDashboard {
  labsCreated: number;
  problems: number;
  studentAttempts: number;
  averageSuccessRate: number;
  mostDifficultProblems: { problemId: ID; title: string; successRate: number }[];
}

export interface StudentPracticeLabDashboard {
  practiceStreak: number;
  problemsSolved: number;
  accepted: number;
  pending: number;
  recentActivity: {
    problemId: ID;
    title: string;
    verdict: SubmissionVerdict;
    at: string;
  }[];
  languageStatistics: { language: PracticeLanguage; count: number }[];
}

export interface RunCodeRequest {
  problemId?: ID;
  practiceLabId?: ID;
  language: PracticeLanguage;
  sourceCode: string;
  stdin?: string | null;
}

export interface RunCodeResult {
  executionId: ID;
  status: ExecutionStatus;
  stdout: string | null;
  stderr: string | null;
  compileOutput: string | null;
  executionTimeMS: number | null;
  memoryKB: number | null;
  exitCode: number | null;
  queuePosition?: number | null;
}

export interface SubmitSolutionRequest {
  problemId: ID;
  language: PracticeLanguage;
  sourceCode: string;
}

export interface ExecutionStatusEvent {
  executionId: ID;
  submissionId?: ID | null;
  status: ExecutionStatus | SubmissionVerdict;
  queuePosition?: number | null;
  message?: string | null;
}
