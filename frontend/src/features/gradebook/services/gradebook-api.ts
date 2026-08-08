import { API_ROUTES, PAGINATION } from '@learnova/constants';
import type { UpsertAcademicPolicyInput } from '@learnova/validation';
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

export interface SemesterGradeRow {
  id: string;
  semesterId: string;
  semesterGpa?: number | null;
  earnedCredits?: number;
  totalCredits?: number;
}

export interface TranscriptRow {
  id: string;
  transcriptNumber?: string;
  transcriptType?: string;
  status?: string;
}

export interface TranscriptSummary {
  semesterGpa?: number | null;
  cgpa?: number | null;
  academicStanding?: string;
}

export interface AcademicPolicy {
  creditBasedGrading?: boolean;
  passingCriteria?: 'marks' | 'grade' | 'both';
  passingPercentage?: number;
  gradingScheme?: 'absolute' | 'relative';
  standingThresholds?: {
    probationGpa?: number;
    warningGpa?: number;
    honorsGpa?: number;
    distinctionGpa?: number;
    failedCourseLimit?: number;
  };
}

export interface TranscriptRequestRow {
  id: string;
  requestType?: string;
  reason?: string | null;
  status?: string;
  studentId?: string;
}

export interface AcademicStandingRow {
  id: string;
  standing?: string;
  semesterGpa?: number | null;
  cgpa?: number | null;
  failedCourseCount?: number;
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
      `${base}/entries${toQuery(params as Record<string, string | number | boolean | undefined>)}`,
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
    apiClient.get<{ items: Record<string, unknown>[] }>(
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
    apiClient.get<{ items: SemesterGradeRow[] }>(
      `${base}/semester${toQuery(params ?? {})}`,
    ),

  courseMatrix: (courseId: string) =>
    apiClient.get<Record<string, unknown>>(`${base}/courses/${courseId}/matrix`),

  exportReport: (params: Record<string, string | undefined>) =>
    apiClient.get<string>(`${base}/reports${toQuery({ ...params, format: 'csv' })}`),

  academicPolicy: () => apiClient.get<AcademicPolicy>(`${base}/policy`),

  upsertAcademicPolicy: (body: UpsertAcademicPolicyInput) =>
    apiClient.put<AcademicPolicy>(`${base}/policy`, body),

  submitModeration: (courseId: string, notes?: string) =>
    apiClient.post<{ submitted: number }>(`${base}/moderation/submit`, { courseId, notes }),

  approveModeration: (courseId: string, notes?: string) =>
    apiClient.post<{ approved: number }>(`${base}/moderation/approve`, { courseId, notes }),

  publishModeration: (courseId: string, notes?: string) =>
    apiClient.post<{ published: number; snapshots: number }>(`${base}/moderation/publish`, {
      courseId,
      notes,
    }),

  moderationTimeline: (courseId: string, studentId?: string) =>
    apiClient.get<{ items: Record<string, unknown>[] }>(
      `${base}/moderation/${courseId}/timeline${toQuery({ studentId })}`,
    ),

  listSnapshots: (courseId: string, studentId?: string) =>
    apiClient.get<{ items: Record<string, unknown>[] }>(
      `${base}/snapshots${toQuery({ courseId, studentId })}`,
    ),

  compareSnapshots: (params: {
    courseId: string;
    studentId: string;
    versionFrom: number;
    versionTo: number;
  }) => apiClient.get<Record<string, unknown>>(`${base}/snapshots/compare${toQuery(params)}`),

  computeStanding: (body?: { studentId?: string; semesterId?: string }) =>
    apiClient.post<{ computed: number }>(`${base}/standing/compute`, body ?? {}),

  listStanding: (params?: { studentId?: string; semesterId?: string }) =>
    apiClient.get<{ items: AcademicStandingRow[] }>(
      `${base}/standing${toQuery(params ?? {})}`,
    ),

  createTranscriptRequest: (body: {
    requestType?: string;
    semesterId?: string | null;
    reason?: string | null;
  }) => apiClient.post(`${base}/transcript-requests`, body),

  listTranscriptRequests: (params?: { status?: string; studentId?: string }) =>
    apiClient.get<{ items: TranscriptRequestRow[] }>(
      `${base}/transcript-requests${toQuery(params ?? {})}`,
    ),

  reviewTranscriptRequest: (body: {
    requestId: string;
    status: 'approved' | 'rejected' | 'completed';
    reviewNotes?: string | null;
  }) => apiClient.post(`${base}/transcript-requests/review`, body),
};
