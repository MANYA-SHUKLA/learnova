import type { QuizDifficulty, QuizStatus, QuizType, QuestionDifficulty, QuestionType } from '@learnova/types';

const QUIZ_STATUS_LABELS: Record<QuizStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived',
  closed: 'Closed',
};

const QUIZ_TYPE_LABELS: Record<QuizType, string> = {
  practice: 'Practice Quiz',
  lesson: 'Lesson Quiz',
  module: 'Module Quiz',
  course: 'Course Quiz',
  revision: 'Revision Quiz',
};

const QUIZ_DIFFICULTY_LABELS: Record<QuizDifficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  mixed: 'Mixed',
};

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  single_choice: 'Single Choice',
  multiple_choice: 'Multiple Choice',
  true_false: 'True / False',
  assertion_reason: 'Assertion & Reason',
  match_following: 'Match Following',
  fill_blank: 'Fill in the Blank',
};

const QUESTION_DIFFICULTY_LABELS: Record<QuestionDifficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

export function formatQuizStatus(status: QuizStatus): string {
  return QUIZ_STATUS_LABELS[status] ?? status;
}

export function formatQuizType(type: QuizType): string {
  return QUIZ_TYPE_LABELS[type] ?? type;
}

export function formatQuizDifficulty(difficulty: QuizDifficulty): string {
  return QUIZ_DIFFICULTY_LABELS[difficulty] ?? difficulty;
}

export function formatQuestionType(type: QuestionType): string {
  return QUESTION_TYPE_LABELS[type] ?? type;
}

export function formatQuestionDifficulty(difficulty: QuestionDifficulty): string {
  return QUESTION_DIFFICULTY_LABELS[difficulty] ?? difficulty;
}

export function formatDuration(minutes: number | null | undefined): string {
  if (!minutes) return '—';
  return `${minutes} min`;
}

export function formatScore(score: number, total?: number): string {
  if (total != null) return `${score.toFixed(1)} / ${total}`;
  return score.toFixed(1);
}

export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}
