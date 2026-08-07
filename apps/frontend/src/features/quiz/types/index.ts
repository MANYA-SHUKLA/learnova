import type {
  CreateQuizInput,
  QuizListQuery,
  UpdateQuizInput,
  CreateQuestionInput,
  UpdateQuestionInput,
  CreateQuestionBankInput,
  UpdateQuestionBankInput,
  StartAttemptInput,
  SubmitQuizInput,
  SubmitAnswerInput,
  QuizBulkActionInput,
} from '@learnova/validation';
import type { PaginatedMeta } from '@learnova/types';

export type QuizListParams = Partial<QuizListQuery>;
export type QuizCreateBody = CreateQuizInput;
export type QuizUpdateBody = UpdateQuizInput;
export type QuestionCreateBody = CreateQuestionInput;
export type QuestionUpdateBody = UpdateQuestionInput;
export type QuestionBankCreateBody = CreateQuestionBankInput;
export type QuestionBankUpdateBody = UpdateQuestionBankInput;
export type StartAttemptBody = StartAttemptInput;
export type SubmitQuizBody = SubmitQuizInput;
export type SubmitAnswerBody = SubmitAnswerInput;
export type BulkActionBody = QuizBulkActionInput;

export interface QuizListResult {
  items: import('@learnova/types').Quiz[];
  meta: PaginatedMeta;
}

export interface QuestionListParams {
  q?: string;
  questionBankId?: string;
  questionType?: string;
  difficulty?: string;
  category?: string;
  tag?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface QuestionListResult {
  items: import('@learnova/types').Question[];
  meta: PaginatedMeta;
}
