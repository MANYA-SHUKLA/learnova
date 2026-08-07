import type { ID } from '../common/index.js';

export type QuizType =
  | 'practice'
  | 'lesson'
  | 'module'
  | 'course'
  | 'revision';

export type QuizStatus = 'draft' | 'published' | 'archived' | 'closed';

export type QuizVisibility = 'institution' | 'enrolled' | 'faculty';

export type QuizDifficulty = 'easy' | 'medium' | 'hard' | 'mixed';

export type QuestionType =
  | 'single_choice'
  | 'multiple_choice'
  | 'true_false'
  | 'assertion_reason'
  | 'match_following'
  | 'fill_blank';

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export type QuizAttemptStatus =
  | 'started'
  | 'submitted'
  | 'completed'
  | 'expired'
  | 'abandoned';

export type QuestionBankStatus = 'active' | 'archived';

export interface QuizAttachment {
  id: ID;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  storageKey: string;
  url: string | null;
}

export interface QuestionOption {
  id: ID;
  optionText: string;
  isCorrect: boolean;
  displayOrder: number;
  feedback: string | null;
}

export interface MatchPair {
  id: ID;
  left: string;
  right: string;
  displayOrder: number;
}

export interface QuestionExplanation {
  text: string | null;
  mediaUrl: string | null;
}

export interface Question {
  id: ID;
  institutionId: ID;
  questionBankId: ID;
  question: string;
  description: string | null;
  questionType: QuestionType;
  difficulty: QuestionDifficulty;
  marks: number;
  negativeMarks: number;
  explanation: QuestionExplanation | null;
  hint: string | null;
  tags: string[];
  category: string | null;
  attachments: QuizAttachment[];
  options: QuestionOption[];
  matchPairs: MatchPair[];
  fillBlankAnswers: string[];
  createdBy: ID | null;
  updatedBy: ID | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface QuestionBank {
  id: ID;
  institutionId: ID;
  title: string;
  slug: string;
  description: string | null;
  status: QuestionBankStatus;
  questionCount: number;
  categoryIds: ID[];
  tagIds: ID[];
  createdBy: ID | null;
  updatedBy: ID | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface QuestionCategory {
  id: ID;
  institutionId: ID;
  name: string;
  slug: string;
  description: string | null;
  questionCount: number;
  createdBy: ID | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface QuestionTag {
  id: ID;
  institutionId: ID;
  name: string;
  slug: string;
  questionCount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface QuizSection {
  id: ID;
  institutionId: ID;
  quizId: ID;
  title: string;
  description: string | null;
  marks: number;
  questionCount: number;
  randomizeQuestions: boolean;
  randomQuestionCount: number | null;
  displayOrder: number;
  questionIds: ID[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Quiz {
  id: ID;
  institutionId: ID;
  courseId: ID;
  moduleId: ID | null;
  lessonId: ID | null;
  title: string;
  slug: string;
  description: string | null;
  instructions: string | null;
  visibility: QuizVisibility;
  status: QuizStatus;
  quizType: QuizType;
  difficulty: QuizDifficulty;
  passingMarks: number;
  totalMarks: number;
  durationMinutes: number | null;
  attemptLimit: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResultsImmediately: boolean;
  showCorrectAnswers: boolean;
  allowReview: boolean;
  negativeMarking: boolean;
  negativeMarkValue: number;
  publishDate: string | null;
  closeDate: string | null;
  sectionIds: ID[];
  questionIds: ID[];
  createdBy: ID | null;
  updatedBy: ID | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface QuizAttempt {
  id: ID;
  institutionId: ID;
  quizId: ID;
  studentId: ID;
  courseId: ID;
  attemptNumber: number;
  startedAt: string;
  submittedAt: string | null;
  status: QuizAttemptStatus;
  score: number;
  percentage: number;
  timeTakenSeconds: number;
  autoSubmitted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuizAnswer {
  id: ID;
  institutionId: ID;
  attemptId: ID;
  questionId: ID;
  selectedOptionIds: ID[];
  textAnswer: string | null;
  matchAnswers: Record<string, string>;
  isCorrect: boolean | null;
  marksAwarded: number;
  timeSpentSeconds: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuizResult {
  id: ID;
  institutionId: ID;
  attemptId: ID;
  quizId: ID;
  studentId: ID;
  totalQuestions: number;
  correct: number;
  incorrect: number;
  skipped: number;
  score: number;
  percentage: number;
  passed: boolean;
  rank: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuizFacultyDashboard {
  quizzesCreated: number;
  publishedQuizzes: number;
  totalAttempts: number;
  averageScore: number;
  completionRate: number;
  mostMissedQuestions: Array<{ questionId: ID; title: string; missRate: number }>;
}

export interface QuizStudentDashboard {
  upcomingQuizzes: number;
  completedQuizzes: number;
  pendingQuizzes: number;
  averageScore: number;
  recentAttempts: QuizAttempt[];
}

export interface QuizInstitutionDashboard {
  totalQuizzes: number;
  questionBankSize: number;
  totalAttempts: number;
  averageScore: number;
  passRate: number;
  departmentComparison: Array<{ department: string; averageScore: number; attempts: number }>;
}

export interface QuizAnalytics {
  quizId: ID;
  totalAttempts: number;
  averageScore: number;
  passRate: number;
  averageTimeSeconds: number;
  questionStats: Array<{
    questionId: ID;
    accuracy: number;
    averageTimeSeconds: number;
    difficulty: QuestionDifficulty;
  }>;
  mostIncorrect: Array<{ questionId: ID; title: string; incorrectRate: number }>;
}
