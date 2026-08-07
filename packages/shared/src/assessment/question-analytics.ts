import type { QuestionStatRow } from '@learnova/types';

export function computeQuestionAccuracy(correct: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((correct / total) * 10000) / 100;
}

export function computePassRate(passed: number, total: number): number | null {
  if (total <= 0) return null;
  return Math.round((passed / total) * 10000) / 100;
}

export function computeIncorrectRate(accuracy: number): number {
  return Math.round((100 - accuracy) * 100) / 100;
}

export function buildQuestionStatRow(input: {
  questionId: string;
  title: string;
  correct: number;
  total: number;
  averageTimeSeconds: number;
  difficulty: string;
}): QuestionStatRow {
  const accuracy = computeQuestionAccuracy(input.correct, input.total);
  return {
    questionId: input.questionId,
    title: input.title,
    accuracy,
    averageTimeSeconds: Math.round(input.averageTimeSeconds * 100) / 100,
    difficulty: input.difficulty,
    incorrectRate: computeIncorrectRate(accuracy),
  };
}

export function rankMostIncorrectQuestions(
  stats: QuestionStatRow[],
  limit = 10,
): QuestionStatRow[] {
  return [...stats].sort((a, b) => b.incorrectRate - a.incorrectRate).slice(0, limit);
}

export function computeAveragePercentage(values: number[]): number | null {
  if (values.length === 0) return null;
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  return Math.round(avg * 100) / 100;
}
