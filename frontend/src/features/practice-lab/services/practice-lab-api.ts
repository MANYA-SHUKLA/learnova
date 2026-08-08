import { API_ROUTES, PAGINATION } from '@learnova/constants';
import type {
  FacultyPracticeLabDashboard,
  LabProblem,
  PaginatedMeta,
  PracticeLab,
  PracticeLabStats,
  RunCodeResult,
  StudentPracticeLabDashboard,
  StudentSubmission,
  ExecutionHistory,
  LeaderboardEntry,
} from '@learnova/types';
import { apiClient } from '@/lib/api/client';
import type {
  CreatePracticeLabBody,
  CreateProblemBody,
  PracticeLabListParams,
  PracticeLabListResult,
  ProblemListParams,
  ProblemListResult,
  RunCodeBody,
  SubmissionListParams,
  SubmitBody,
} from '../types';

const base = API_ROUTES.PRACTICE_LABS;

const emptyMeta = (page?: number, limit?: number): PaginatedMeta => ({
  page: page ?? PAGINATION.DEFAULT_PAGE,
  limit: limit ?? PAGINATION.DEFAULT_LIMIT,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false,
});

function toQuery(params: object = {}): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const practiceLabApi = {
  list: async (params: PracticeLabListParams = {}): Promise<PracticeLabListResult> => {
    const { data, meta } = await apiClient.getWithMeta<{ items: PracticeLab[] }>(
      `${base}${toQuery(params)}`,
    );
    return { items: data.items, meta: meta ?? emptyMeta(params.page, params.limit) };
  },

  get: (id: string) => apiClient.get<PracticeLab>(`${base}/${id}`),

  create: (body: CreatePracticeLabBody) => apiClient.post<PracticeLab>(base, body),

  publish: (id: string) => apiClient.post<PracticeLab>(`${base}/${id}/publish`, {}),

  archive: (id: string) => apiClient.post<PracticeLab>(`${base}/${id}/archive`, {}),

  duplicate: (id: string, body: { title?: string } = {}) =>
    apiClient.post<PracticeLab>(`${base}/${id}/duplicate`, body),

  listProblems: async (params: ProblemListParams = {}): Promise<ProblemListResult> => {
    const { data, meta } = await apiClient.getWithMeta<{ items: LabProblem[] }>(
      `${base}/problems${toQuery(params)}`,
    );
    return { items: data.items, meta: meta ?? emptyMeta(params.page, params.limit) };
  },

  getProblem: (id: string) => apiClient.get<LabProblem>(`${base}/problems/${id}`),

  createProblem: (body: CreateProblemBody) =>
    apiClient.post<LabProblem>(`${base}/problems`, body),

  run: (body: RunCodeBody) => apiClient.post<RunCodeResult>(`${base}/run`, body),

  submit: (body: SubmitBody) => apiClient.post<StudentSubmission>(`${base}/submit`, body),

  listSubmissions: async (params: SubmissionListParams = {}) => {
    const { data, meta } = await apiClient.getWithMeta<{ items: StudentSubmission[] }>(
      `${base}/submissions${toQuery(params)}`,
    );
    return { items: data.items, meta: meta ?? emptyMeta(params.page, params.limit) };
  },

  listExecutions: async (params: Record<string, string | number | undefined> = {}) => {
    const { data, meta } = await apiClient.getWithMeta<{ items: ExecutionHistory[] }>(
      `${base}/executions${toQuery(params)}`,
    );
    return { items: data.items, meta: meta ?? emptyMeta() };
  },

  leaderboard: async (params: Record<string, string | number | undefined> = {}) => {
    const { data, meta } = await apiClient.getWithMeta<{ items: LeaderboardEntry[] }>(
      `${base}/leaderboard${toQuery(params)}`,
    );
    return { items: data.items, meta: meta ?? emptyMeta() };
  },

  institutionDashboard: () =>
    apiClient.get<PracticeLabStats>(`${base}/dashboard/institution`),

  facultyDashboard: () =>
    apiClient.get<FacultyPracticeLabDashboard>(`${base}/dashboard/faculty`),

  studentDashboard: () =>
    apiClient.get<StudentPracticeLabDashboard>(`${base}/dashboard/student`),

  languages: () =>
    apiClient.get<
      {
        id: string;
        key: string;
        name: string;
        monacoLanguage: string;
        version: string | null;
      }[]
    >(`${base}/languages`),
};
