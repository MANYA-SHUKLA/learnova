import { API_ROUTES, PAGINATION } from '@learnova/constants';
import type {
  Exam,
  ExamAnalytics,
  ExamAttempt,
  ExamFacultyDashboard,
  ExamInstitutionDashboard,
  ExamResult,
  ExamSeating,
  ExamStudentDashboard,
  PaginatedMeta,
} from '@learnova/types';
import { apiClient } from '@/lib/api/client';
import type {
  AssignSeatingBody,
  BulkActionBody,
  CheckInBody,
  ExamCreateBody,
  ExamListParams,
  ExamListResult,
  ExamUpdateBody,
  ProctorEventBody,
  StartAttemptBody,
  SubmitExamBody,
} from '../types';

const base = API_ROUTES.EXAMINATIONS;

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

export const examinationApi = {
  list: async (params: ExamListParams = {}): Promise<ExamListResult> => {
    const { data, meta } = await apiClient.getWithMeta<{ items: Exam[] }>(
      `${base}${toQuery(params as Record<string, string | number | boolean | undefined>)}`,
    );
    return { items: data.items, meta: meta ?? emptyMeta(params.page, params.limit) };
  },

  get: (id: string) => apiClient.get<Exam>(`${base}/${id}`),

  create: (body: ExamCreateBody) => apiClient.post<Exam>(base, body),

  update: (id: string, body: ExamUpdateBody) => apiClient.patch<Exam>(`${base}/${id}`, body),

  remove: (id: string) => apiClient.delete<{ id: string }>(`${base}/${id}`),

  publish: (id: string) => apiClient.post<Exam>(`${base}/${id}/publish`, {}),

  schedule: (id: string) => apiClient.post<Exam>(`${base}/${id}/schedule`, {}),

  cancel: (id: string) => apiClient.post<Exam>(`${base}/${id}/cancel`, {}),

  archive: (id: string) => apiClient.post<Exam>(`${base}/${id}/archive`, {}),

  duplicate: (id: string) => apiClient.post<Exam>(`${base}/${id}/duplicate`, {}),

  bulk: (body: BulkActionBody) => apiClient.post<{ affected: number }>(`${base}/bulk`, body),

  assignSeating: (body: AssignSeatingBody) =>
    apiClient.post<{ assigned: number }>(`${base}/seating/assign`, body),

  listSeating: (examId: string) =>
    apiClient.get<{ items: ExamSeating[] }>(`${base}/${examId}/seating`),

  checkIn: (body: CheckInBody) => apiClient.post(`${base}/check-in`, body),

  startAttempt: (body: StartAttemptBody) =>
    apiClient.post<{ attempt: ExamAttempt; questions: unknown[]; remainingSeconds: number | null }>(
      `${base}/attempts/start`,
      body,
    ),

  saveAnswer: (attemptId: string, body: import('../types').SubmitExamBody['answers'][0]) =>
    apiClient.post(`${base}/attempts/${attemptId}/answers`, body),

  submitExam: (body: SubmitExamBody) =>
    apiClient.post<{ attempt: ExamAttempt; result: ExamResult }>(`${base}/attempts/submit`, body),

  getAttempt: (id: string) => apiClient.get<ExamAttempt>(`${base}/attempts/${id}`),

  listAttempts: async (params: { examId?: string; page?: number; limit?: number } = {}) => {
    const { data, meta } = await apiClient.getWithMeta<{ items: ExamAttempt[] }>(
      `${base}/attempts${toQuery(params as Record<string, string | number | undefined>)}`,
    );
    return { items: data.items, meta: meta ?? emptyMeta(params.page, params.limit) };
  },

  flagAttempt: (attemptId: string) =>
    apiClient.post(`${base}/attempts/${attemptId}/proctor/flag`, {}),

  clearAttempt: (attemptId: string) =>
    apiClient.post(`${base}/attempts/${attemptId}/proctor/clear`, {}),

  terminateAttempt: (attemptId: string) =>
    apiClient.post(`${base}/attempts/${attemptId}/proctor/terminate`, {}),

  logProctorEvent: (body: ProctorEventBody) =>
    apiClient.post(`${base}/proctor/events`, body),

  getAnalytics: (id: string) => apiClient.get<ExamAnalytics>(`${base}/${id}/analytics`),

  facultyDashboard: () => apiClient.get<ExamFacultyDashboard>(`${base}/dashboard/faculty`),

  studentDashboard: () => apiClient.get<ExamStudentDashboard>(`${base}/dashboard/student`),

  institutionDashboard: () =>
    apiClient.get<ExamInstitutionDashboard>(`${base}/dashboard/institution`),
};
