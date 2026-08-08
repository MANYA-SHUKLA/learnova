import type {
  FacultyPracticeLabDashboard,
  LabProblem,
  PaginatedMeta,
  PracticeDifficulty,
  PracticeLab,
  PracticeLabStats,
  PracticeLabStatus,
  PracticeLanguage,
  RunCodeResult,
  StudentPracticeLabDashboard,
  StudentSubmission,
  ExecutionHistory,
  LeaderboardEntry,
} from '@learnova/types';

export type {
  PracticeLab,
  LabProblem,
  PracticeLabStatus,
  PracticeDifficulty,
  PracticeLanguage,
  StudentSubmission,
  RunCodeResult,
  ExecutionHistory,
  LeaderboardEntry,
  PracticeLabStats,
  FacultyPracticeLabDashboard,
  StudentPracticeLabDashboard,
};

export type PracticeLabListParams = {
  q?: string;
  courseId?: string;
  status?: PracticeLabStatus;
  difficulty?: PracticeDifficulty;
  language?: PracticeLanguage;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export type PracticeLabListResult = {
  items: PracticeLab[];
  meta: PaginatedMeta;
};

export type ProblemListParams = {
  q?: string;
  practiceLabId?: string;
  difficulty?: PracticeDifficulty;
  tag?: string;
  language?: PracticeLanguage;
  solved?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export type ProblemListResult = {
  items: LabProblem[];
  meta: PaginatedMeta;
};

export type CreatePracticeLabBody = {
  courseId: string;
  title: string;
  description?: string | null;
  difficulty?: PracticeDifficulty;
  languages?: PracticeLanguage[];
  estimatedMinutes?: number | null;
  allowRun?: boolean;
  allowSubmit?: boolean;
  maxSubmissions?: number;
};

export type CreateProblemBody = {
  practiceLabId: string;
  title: string;
  problemStatement: string;
  difficulty?: PracticeDifficulty;
  tags?: string[];
  sampleInput?: string | null;
  sampleOutput?: string | null;
  allowedLanguages?: PracticeLanguage[];
};

export type RunCodeBody = {
  problemId?: string;
  practiceLabId?: string;
  language: PracticeLanguage;
  sourceCode: string;
  stdin?: string | null;
};

export type SubmitBody = {
  problemId: string;
  language: PracticeLanguage;
  sourceCode: string;
};

export type SubmissionListParams = {
  practiceLabId?: string;
  problemId?: string;
  page?: number;
  limit?: number;
};
