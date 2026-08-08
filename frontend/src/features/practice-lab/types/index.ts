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

export interface PracticeLabListParams {
  q?: string;
  courseId?: string;
  status?: PracticeLabStatus;
  difficulty?: PracticeDifficulty;
  language?: PracticeLanguage;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PracticeLabListResult {
  items: PracticeLab[];
  meta: PaginatedMeta;
}

export interface ProblemListParams {
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
}

export interface ProblemListResult {
  items: LabProblem[];
  meta: PaginatedMeta;
}

export interface CreatePracticeLabBody {
  courseId: string;
  title: string;
  description?: string | null;
  difficulty?: PracticeDifficulty;
  languages?: PracticeLanguage[];
  estimatedMinutes?: number | null;
  allowRun?: boolean;
  allowSubmit?: boolean;
  maxSubmissions?: number;
}

export interface CreateProblemBody {
  practiceLabId: string;
  title: string;
  problemStatement: string;
  difficulty?: PracticeDifficulty;
  tags?: string[];
  sampleInput?: string | null;
  sampleOutput?: string | null;
  allowedLanguages?: PracticeLanguage[];
}

export interface RunCodeBody {
  problemId?: string;
  practiceLabId?: string;
  language: PracticeLanguage;
  sourceCode: string;
  stdin?: string | null;
}

export interface SubmitBody {
  problemId: string;
  language: PracticeLanguage;
  sourceCode: string;
}

export interface SubmissionListParams {
  practiceLabId?: string;
  problemId?: string;
  page?: number;
  limit?: number;
}
