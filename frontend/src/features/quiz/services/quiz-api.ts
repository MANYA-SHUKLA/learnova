import { API_ROUTES, PAGINATION } from '@learnova/constants';
import type {
  Question,
  QuestionBank,
  QuestionCategory,
  QuestionTag,
  Quiz,
  QuizAnalytics,
  QuizAttempt,
  QuizFacultyDashboard,
  QuizInstitutionDashboard,
  QuizResult,
  QuizStudentDashboard,
  PaginatedMeta,
} from '@learnova/types';
import { apiClient } from '@/lib/api/client';
import type {
  BulkActionBody,
  QuestionBankCreateBody,
  QuestionBankUpdateBody,
  QuestionCreateBody,
  QuestionListParams,
  QuestionListResult,
  QuestionUpdateBody,
  QuizCreateBody,
  QuizListParams,
  QuizListResult,
  QuizUpdateBody,
  StartAttemptBody,
  SubmitAnswerBody,
  SubmitQuizBody,
} from '../types';

const base = API_ROUTES.QUIZZES;

const emptyMeta = (page?: number, limit?: number): PaginatedMeta => ({
  page: page ?? PAGINATION.DEFAULT_PAGE,
  limit: limit ?? PAGINATION.DEFAULT_LIMIT,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false,
});

function toQuery(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const quizApi = {
  list: async (params: QuizListParams = {}): Promise<QuizListResult> => {
    const { data, meta } = await apiClient.getWithMeta<{ items: Quiz[] }>(
      `${base}${toQuery(params)}`,
    );
    return { items: data.items, meta: meta ?? emptyMeta(params.page, params.limit) };
  },

  search: async (params: QuizListParams = {}): Promise<QuizListResult> => {
    const { data, meta } = await apiClient.getWithMeta<{ items: Quiz[] }>(
      `${base}/search${toQuery(params)}`,
    );
    return { items: data.items, meta: meta ?? emptyMeta(params.page, params.limit) };
  },

  get: (id: string) => apiClient.get<Quiz>(`${base}/${id}`),

  create: (body: QuizCreateBody) => apiClient.post<Quiz>(base, body),

  update: (id: string, body: QuizUpdateBody) => apiClient.patch<Quiz>(`${base}/${id}`, body),

  remove: (id: string) => apiClient.delete<{ id: string }>(`${base}/${id}`),

  publish: (id: string) => apiClient.post<Quiz>(`${base}/${id}/publish`, {}),

  archive: (id: string) => apiClient.post<Quiz>(`${base}/${id}/archive`, {}),

  close: (id: string) => apiClient.post<Quiz>(`${base}/${id}/close`, {}),

  duplicate: (id: string) => apiClient.post<Quiz>(`${base}/${id}/duplicate`, {}),

  bulk: (body: BulkActionBody) =>
    apiClient.post<{ affected: number }>(`${base}/bulk`, body),

  facultyDashboard: () => apiClient.get<QuizFacultyDashboard>(`${base}/dashboard/faculty`),

  studentDashboard: () => apiClient.get<QuizStudentDashboard>(`${base}/dashboard/student`),

  institutionDashboard: () =>
    apiClient.get<QuizInstitutionDashboard>(`${base}/dashboard/institution`),

  getAnalytics: (id: string) => apiClient.get<QuizAnalytics>(`${base}/${id}/analytics`),

  listBanks: () => apiClient.get<{ items: QuestionBank[] }>('/question-banks'),

  createBank: (body: QuestionBankCreateBody) =>
    apiClient.post<QuestionBank>('/question-banks', body),

  updateBank: (id: string, body: QuestionBankUpdateBody) =>
    apiClient.patch<QuestionBank>(`/question-banks/${id}`, body),

  duplicateBank: (id: string) =>
    apiClient.post<QuestionBank>(`/question-banks/${id}/duplicate`, {}),

  listQuestions: async (params: QuestionListParams = {}): Promise<QuestionListResult> => {
    const { data, meta } = await apiClient.getWithMeta<{ items: Question[] }>(
      `/questions${toQuery(params as Record<string, string | number | boolean | undefined>)}`,
    );
    return { items: data.items, meta: meta ?? emptyMeta(params.page, params.limit) };
  },

  createQuestion: (body: QuestionCreateBody) =>
    apiClient.post<Question>('/questions', body),

  updateQuestion: (id: string, body: QuestionUpdateBody) =>
    apiClient.patch<Question>(`/questions/${id}`, body),

  deleteQuestion: (id: string) => apiClient.delete<{ id: string }>(`/questions/${id}`),

  duplicateQuestion: (id: string) =>
    apiClient.post<Question>(`/questions/${id}/duplicate`, {}),

  listCategories: () => apiClient.get<{ items: QuestionCategory[] }>('/question-categories'),

  listTags: () => apiClient.get<{ items: QuestionTag[] }>('/question-tags'),

  startAttempt: (body: StartAttemptBody) =>
    apiClient.post<{ attempt: QuizAttempt; questions: unknown[] }>('/attempts/start', body),

  saveAnswer: (attemptId: string, body: SubmitAnswerBody) =>
    apiClient.post(`/attempts/${attemptId}/answers`, body),

  submitQuiz: (body: SubmitQuizBody) =>
    apiClient.post<{ attempt: QuizAttempt; result: QuizResult }>('/attempts/submit', body),

  getAttempt: (id: string) => apiClient.get<QuizAttempt>(`/attempts/${id}`),

  listAttempts: (params: { quizId?: string; page?: number; limit?: number } = {}) =>
    apiClient.getWithMeta<{ items: QuizAttempt[] }>(
      `/attempts${toQuery(params)}`,
    ),
};
