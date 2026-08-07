import { API_ROUTES, PAGINATION } from '@learnova/constants';
import type {
  Assignment,
  AssignmentComment,
  AssignmentFacultyDashboard,
  AssignmentGrade,
  AssignmentInstitutionDashboard,
  AssignmentRubric,
  AssignmentStudentDashboard,
  AssignmentSubmission,
  PaginatedMeta,
} from '@learnova/types';
import { apiClient } from '@/lib/api/client';
import type {
  AssignmentCreateBody,
  AssignmentListParams,
  AssignmentListResult,
  AssignmentUpdateBody,
  GradeBody,
  SubmissionListParams,
  SubmissionListResult,
  SubmitBody,
} from '../types';

const base = API_ROUTES.ASSIGNMENTS;

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

export const assignmentApi = {
  list: async (params: AssignmentListParams = {}): Promise<AssignmentListResult> => {
    const { data, meta } = await apiClient.getWithMeta<{ items: Assignment[] }>(
      `${base}${toQuery(params as Record<string, string | number | boolean | undefined>)}`,
    );
    return { items: data.items, meta: meta ?? emptyMeta(params.page, params.limit) };
  },

  listMine: async (params: AssignmentListParams = {}): Promise<AssignmentListResult> => {
    const { data, meta } = await apiClient.getWithMeta<{ items: Assignment[] }>(
      `${base}/me${toQuery(params as Record<string, string | number | boolean | undefined>)}`,
    );
    return { items: data.items, meta: meta ?? emptyMeta(params.page, params.limit) };
  },

  search: async (params: AssignmentListParams = {}): Promise<AssignmentListResult> => {
    const { data, meta } = await apiClient.getWithMeta<{ items: Assignment[] }>(
      `${base}/search${toQuery(params as Record<string, string | number | boolean | undefined>)}`,
    );
    return { items: data.items, meta: meta ?? emptyMeta(params.page, params.limit) };
  },

  get: (id: string) => apiClient.get<Assignment>(`${base}/${id}`),

  create: (body: AssignmentCreateBody) => apiClient.post<Assignment>(base, body),

  update: (id: string, body: AssignmentUpdateBody) =>
    apiClient.patch<Assignment>(`${base}/${id}`, body),

  remove: (id: string) => apiClient.delete<{ id: string }>(`${base}/${id}`),

  publish: (id: string) => apiClient.post<Assignment>(`${base}/${id}/publish`, {}),

  archive: (id: string) => apiClient.post<Assignment>(`${base}/${id}/archive`, {}),

  close: (id: string) => apiClient.post<Assignment>(`${base}/${id}/close`, {}),

  listSubmissions: async (params: SubmissionListParams = {}): Promise<SubmissionListResult> => {
    const { data, meta } = await apiClient.getWithMeta<{ items: AssignmentSubmission[] }>(
      `${base}/submissions${toQuery(params as Record<string, string | number | boolean | undefined>)}`,
    );
    return { items: data.items, meta: meta ?? emptyMeta(params.page, params.limit) };
  },

  getSubmission: (id: string) =>
    apiClient.get<AssignmentSubmission>(`${base}/submissions/${id}`),

  saveDraft: (body: SubmitBody) =>
    apiClient.post<AssignmentSubmission>(`${base}/submissions/draft`, body),

  submit: (body: SubmitBody) =>
    apiClient.post<AssignmentSubmission>(`${base}/submissions/submit`, body),

  grade: (submissionId: string, body: GradeBody) =>
    apiClient.post<{ submission: AssignmentSubmission; grade: AssignmentGrade }>(
      `${base}/submissions/${submissionId}/grade`,
      body,
    ),

  listComments: (assignmentId: string) =>
    apiClient.get<{ items: AssignmentComment[] }>(`${base}/${assignmentId}/comments`),

  addComment: (
    assignmentId: string,
    body: { body: string; submissionId?: string | null; parentCommentId?: string | null },
  ) => apiClient.post<AssignmentComment>(`${base}/${assignmentId}/comments`, body),

  listRubrics: async (params: { q?: string; page?: number; limit?: number } = {}) => {
    const { data, meta } = await apiClient.getWithMeta<{ items: AssignmentRubric[] }>(
      `${base}/rubrics${toQuery(params)}`,
    );
    return { items: data.items, meta: meta ?? emptyMeta(params.page, params.limit) };
  },

  facultyDashboard: () =>
    apiClient.get<AssignmentFacultyDashboard>(`${base}/dashboard/faculty`),

  studentDashboard: () =>
    apiClient.get<AssignmentStudentDashboard>(`${base}/dashboard/student`),

  institutionDashboard: () =>
    apiClient.get<AssignmentInstitutionDashboard>(`${base}/dashboard/institution`),

  stats: () => apiClient.get<AssignmentInstitutionDashboard>(`${base}/stats`),
};
