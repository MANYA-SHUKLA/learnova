import { API_ROUTES, PAGINATION } from '@learnova/constants';
import type {
  PaginatedMeta,
  Project,
  ProjectFacultyDashboard,
  ProjectGrade,
  ProjectInstitutionDashboard,
  ProjectMilestone,
  ProjectReview,
  ProjectStudentDashboard,
  ProjectSubmission,
  ProjectTeam,
} from '@learnova/types';
import { apiClient } from '@/lib/api/client';
import type {
  GradeBody,
  JoinTeamBody,
  MilestoneCreateBody,
  MilestoneUpdateBody,
  ProjectCreateBody,
  ProjectListParams,
  ProjectListResult,
  ProjectUpdateBody,
  ReviewCreateBody,
  ReviewSubmitBody,
  SubmissionListParams,
  SubmissionListResult,
  TeamCreateBody,
  TeamListParams,
  TeamListResult,
  TeamUpdateBody,
  MilestoneListResult,
  SubmitBody,
} from '../types';

const base = API_ROUTES.PROJECTS;

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

export const projectApi = {
  list: async (params: ProjectListParams = {}): Promise<ProjectListResult> => {
    const { data, meta } = await apiClient.getWithMeta<{ items: Project[] }>(
      `${base}${toQuery(params as Record<string, string | number | boolean | undefined>)}`,
    );
    return { items: data.items, meta: meta ?? emptyMeta(params.page, params.limit) };
  },

  listMine: async (params: ProjectListParams = {}): Promise<ProjectListResult> => {
    const { data, meta } = await apiClient.getWithMeta<{ items: Project[] }>(
      `${base}/me${toQuery(params as Record<string, string | number | boolean | undefined>)}`,
    );
    return { items: data.items, meta: meta ?? emptyMeta(params.page, params.limit) };
  },

  search: async (params: ProjectListParams = {}): Promise<ProjectListResult> => {
    const { data, meta } = await apiClient.getWithMeta<{ items: Project[] }>(
      `${base}/search${toQuery(params as Record<string, string | number | boolean | undefined>)}`,
    );
    return { items: data.items, meta: meta ?? emptyMeta(params.page, params.limit) };
  },

  get: (id: string) => apiClient.get<Project>(`${base}/${id}`),

  create: (body: ProjectCreateBody) => apiClient.post<Project>(base, body),

  update: (id: string, body: ProjectUpdateBody) =>
    apiClient.patch<Project>(`${base}/${id}`, body),

  remove: (id: string) => apiClient.delete<{ id: string }>(`${base}/${id}`),

  publish: (id: string) => apiClient.post<Project>(`${base}/${id}/publish`, {}),

  archive: (id: string) => apiClient.post<Project>(`${base}/${id}/archive`, {}),

  close: (id: string) => apiClient.post<Project>(`${base}/${id}/close`, {}),

  duplicate: (id: string) => apiClient.post<Project>(`${base}/${id}/duplicate`, {}),

  listMilestones: (projectId: string) =>
    apiClient.get<MilestoneListResult>(`${base}/milestones${toQuery({ projectId })}`),

  createMilestone: (body: MilestoneCreateBody) =>
    apiClient.post<ProjectMilestone>(`${base}/milestones`, body),

  updateMilestone: (id: string, body: MilestoneUpdateBody) =>
    apiClient.patch<ProjectMilestone>(`${base}/milestones/${id}`, body),

  deleteMilestone: (id: string) =>
    apiClient.delete<{ id: string }>(`${base}/milestones/${id}`),

  completeMilestone: (id: string) =>
    apiClient.post<ProjectMilestone>(`${base}/milestones/${id}/complete`, {}),

  listTeams: async (params: TeamListParams = {}): Promise<TeamListResult> => {
    const { data, meta } = await apiClient.getWithMeta<{ items: ProjectTeam[] }>(
      `${base}/teams${toQuery(params as Record<string, string | number | boolean | undefined>)}`,
    );
    return { items: data.items, meta: meta ?? emptyMeta(params.page, params.limit) };
  },

  getTeam: (id: string) => apiClient.get<ProjectTeam>(`${base}/teams/${id}`),

  createTeam: (body: TeamCreateBody) => apiClient.post<ProjectTeam>(`${base}/teams`, body),

  joinTeam: (body: JoinTeamBody) => apiClient.post<ProjectTeam>(`${base}/teams/join`, body),

  updateTeam: (id: string, body: TeamUpdateBody) =>
    apiClient.patch<ProjectTeam>(`${base}/teams/${id}`, body),

  leaveTeam: (id: string) => apiClient.post<{ id: string }>(`${base}/teams/${id}/leave`, {}),

  removeTeamMember: (teamId: string, studentId: string) =>
    apiClient.delete<{ id: string }>(`${base}/teams/${teamId}/members/${studentId}`),

  listSubmissions: async (params: SubmissionListParams = {}): Promise<SubmissionListResult> => {
    const { data, meta } = await apiClient.getWithMeta<{ items: ProjectSubmission[] }>(
      `${base}/submissions${toQuery(params as Record<string, string | number | boolean | undefined>)}`,
    );
    return { items: data.items, meta: meta ?? emptyMeta(params.page, params.limit) };
  },

  getSubmission: (id: string) =>
    apiClient.get<ProjectSubmission>(`${base}/submissions/${id}`),

  saveDraft: (body: SubmitBody) =>
    apiClient.post<ProjectSubmission>(`${base}/submissions/draft`, body),

  submit: (body: SubmitBody) =>
    apiClient.post<ProjectSubmission>(`${base}/submissions/submit`, body),

  grade: (submissionId: string, body: GradeBody) =>
    apiClient.post<{ submission: ProjectSubmission; grade: ProjectGrade }>(
      `${base}/submissions/${submissionId}/grade`,
      body,
    ),

  createReview: (body: ReviewCreateBody) =>
    apiClient.post<ProjectReview>(`${base}/reviews`, body),

  getReview: (id: string) => apiClient.get<ProjectReview>(`${base}/reviews/${id}`),

  submitReview: (id: string, body: ReviewSubmitBody) =>
    apiClient.post<ProjectReview>(`${base}/reviews/${id}/submit`, body),

  facultyDashboard: () =>
    apiClient.get<ProjectFacultyDashboard>(`${base}/dashboard/faculty`),

  studentDashboard: () =>
    apiClient.get<ProjectStudentDashboard>(`${base}/dashboard/student`),

  institutionDashboard: () =>
    apiClient.get<ProjectInstitutionDashboard>(`${base}/dashboard/institution`),

  stats: () => apiClient.get<ProjectInstitutionDashboard>(`${base}/stats`),
};
