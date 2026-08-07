import { API_ROUTES, PAGINATION } from '@learnova/constants';
import type {
  CourseGradeSummary,
  GradebookCourseDashboard,
  GradebookEntry,
  GradebookStudentDashboard,
  GradebookWeightScheme,
  PaginatedMeta,
} from '@learnova/types';
import { apiClient } from '@/lib/api/client';

const base = API_ROUTES.GRADEBOOK;

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

export interface GradebookListParams {
  courseId?: string;
  studentId?: string;
  activityKind?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export const gradebookApi = {
  listEntries: async (params: GradebookListParams = {}) => {
    const { data, meta } = await apiClient.getWithMeta<{ items: GradebookEntry[] }>(
      `${base}/entries${toQuery(params)}`,
    );
    return { items: data.items, meta: meta ?? emptyMeta(params.page, params.limit) };
  },

  courseEntries: async (courseId: string, studentId?: string) => {
    const { data, meta } = await apiClient.getWithMeta<{ items: GradebookEntry[] }>(
      `${base}/courses/${courseId}/entries${toQuery({ studentId })}`,
    );
    return { items: data.items, meta: meta ?? emptyMeta() };
  },

  courseSummaries: (courseId: string, studentId?: string) =>
    apiClient.get<{ items: CourseGradeSummary[] }>(
      `${base}/courses/${courseId}/summaries${toQuery({ studentId })}`,
    ),

  weightScheme: (courseId: string) =>
    apiClient.get<GradebookWeightScheme>(`${base}/courses/${courseId}/weight-scheme`),

  upsertWeightScheme: (body: Record<string, unknown>) =>
    apiClient.put<GradebookWeightScheme>(`${base}/weight-scheme`, body),

  syncCourse: (courseId: string) =>
    apiClient.post<{ ingested: number; students: number }>(`${base}/sync`, { courseId }),

  finalizeCourse: (courseId: string) =>
    apiClient.post<{ finalized: number }>(`${base}/finalize`, { courseId }),

  assignProjectGrade: (body: Record<string, unknown>) =>
    apiClient.post<{ grade: Record<string, unknown>; submissionId: string }>(
      `${base}/project/grade`,
      body,
    ),

  pendingProjects: (courseId: string) =>
    apiClient.get<{ items: Array<Record<string, unknown>> }>(
      `${base}/courses/${courseId}/pending-projects`,
    ),

  institutionDashboard: (courseId?: string) =>
    apiClient.get<GradebookCourseDashboard | Record<string, unknown>>(
      `${base}/dashboard/institution${toQuery({ courseId })}`,
    ),

  facultyDashboard: (courseId: string) =>
    apiClient.get<GradebookCourseDashboard>(
      `${base}/dashboard/faculty${toQuery({ courseId })}`,
    ),

  studentDashboard: () =>
    apiClient.get<GradebookStudentDashboard>(`${base}/dashboard/student`),

  semesterGrades: (params?: { studentId?: string; semesterId?: string }) =>
    apiClient.get<{ items: Array<Record<string, unknown>> }>(
      `${base}/semester${toQuery(params ?? {})}`,
    ),

  courseMatrix: (courseId: string) =>
    apiClient.get<Record<string, unknown>>(`${base}/courses/${courseId}/matrix`),

  exportReport: (params: Record<string, string | undefined>) =>
    apiClient.get<string>(`${base}/reports${toQuery({ ...params, format: 'csv' })}`),
};
