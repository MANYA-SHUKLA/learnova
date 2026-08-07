import { API_ROUTES, PAGINATION } from '@learnova/constants';
import type {
  PaginatedMeta,
  Project,
  ProjectGrade,
  ProjectMilestone,
  ProjectReview,
  ProjectSubmission,
  ProjectTeam,
} from '@learnova/types';
import { apiClient } from '@/lib/api/client';
import type {
  BulkAssignFacultyBody,
  BulkIdsBody,
  BulkResult,
  CommentCreateBody,
  CommentListParams,
  CommentListResult,
  CommentUpdateBody,
  GradeBody,
  JoinTeamBody,
  MilestoneCreateBody,
  MilestoneListResult,
  MilestoneUpdateBody,
  MyTeamListResult,
  ProjectCategory,
  ProjectComment,
  ProjectCreateBody,
  ProjectFacultyDashboard,
  ProjectInstitutionDashboard,
  ProjectListParams,
  ProjectListResult,
  ProjectStudentDashboard,
  ProjectTag,
  ProjectUpdateBody,
  ReviewCreateBody,
  ReviewSubmitBody,
  SubmissionListParams,
  SubmissionListResult,
  SubmitBody,
  TeamCreateBody,
  TeamInviteBody,
  TeamListParams,
  TeamListResult,
  TeamRejectBody,
  TeamTransferLeadershipBody,
  TeamUpdateBody,
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

function mapSortParams(params: ProjectListParams): ProjectListParams {
  if (!params.sort) return params;
  const sortMap: Record<string, { sortBy: string; sortOrder: 'asc' | 'desc' }> = {
    newest: { sortBy: 'createdAt', sortOrder: 'desc' },
    oldest: { sortBy: 'createdAt', sortOrder: 'asc' },
    deadline: { sortBy: 'dueDate', sortOrder: 'asc' },
    title: { sortBy: 'title', sortOrder: 'asc' },
    difficulty: { sortBy: 'difficulty', sortOrder: 'asc' },
  };
  const mapped = sortMap[params.sort];
  if (!mapped) return params;
  return { ...params, sortBy: mapped.sortBy, sortOrder: mapped.sortOrder };
}

export const projectApi = {
  list: async (params: ProjectListParams = {}): Promise<ProjectListResult> => {
    const query = mapSortParams(params);
    const { data, meta } = await apiClient.getWithMeta<{ items: Project[] }>(
      `${base}${toQuery(query as Record<string, string | number | boolean | undefined>)}`,
    );
    return { items: data.items, meta: meta ?? emptyMeta(params.page, params.limit) };
  },

  listMine: async (params: ProjectListParams = {}): Promise<ProjectListResult> => {
    const query = mapSortParams(params);
    const { data, meta } = await apiClient.getWithMeta<{ items: Project[] }>(
      `${base}/me${toQuery(query as Record<string, string | number | boolean | undefined>)}`,
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

  bulkPublish: (body: BulkIdsBody) =>
    apiClient.post<BulkResult>(`${base}/bulk/publish`, body),

  bulkArchive: (body: BulkIdsBody) =>
    apiClient.post<BulkResult>(`${base}/bulk/archive`, body),

  bulkDelete: (body: BulkIdsBody) =>
    apiClient.post<BulkResult>(`${base}/bulk/delete`, body),

  bulkDuplicate: (body: BulkIdsBody) =>
    apiClient.post<BulkResult>(`${base}/bulk/duplicate`, body),

  bulkAssignFaculty: (body: BulkAssignFacultyBody) =>
    apiClient.post<BulkResult>(`${base}/bulk/assign-faculty`, body),

  listCategories: () => apiClient.get<{ items: ProjectCategory[] }>(`${base}/categories`),

  listTags: () => apiClient.get<{ items: ProjectTag[] }>(`${base}/tags`),

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

  approveTeam: (id: string) => apiClient.post<ProjectTeam>(`${base}/teams/${id}/approve`, {}),

  rejectTeam: (id: string, body: TeamRejectBody = {}) =>
    apiClient.post<ProjectTeam>(`${base}/teams/${id}/reject`, body),

  inviteToTeam: (id: string, body: TeamInviteBody) =>
    apiClient.post<{ id: string }>(`${base}/teams/${id}/invite`, body),

  transferTeamLeadership: (id: string, body: TeamTransferLeadershipBody) =>
    apiClient.post<ProjectTeam>(`${base}/teams/${id}/transfer-leadership`, body),

  acceptInvitation: (invitationId: string) =>
    apiClient.post<{ id: string }>(`${base}/teams/invitations/${invitationId}/accept`, {}),

  rejectInvitation: (invitationId: string) =>
    apiClient.post<{ id: string }>(`${base}/teams/invitations/${invitationId}/reject`, {}),

  myTeam: async (params: { page?: number; limit?: number } = {}): Promise<MyTeamListResult> => {
    const { data, meta } = await apiClient.getWithMeta<MyTeamListResult>(
      `${base}/my-team${toQuery(params)}`,
    );
    return {
      items: data.items ?? [],
      meta: meta ?? emptyMeta(params.page, params.limit),
    };
  },

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

  listComments: async (params: CommentListParams): Promise<CommentListResult> => {
    const { projectId, ...rest } = params;
    const { data, meta } = await apiClient.getWithMeta<{ items: ProjectComment[] }>(
      `${base}/${projectId}/comments${toQuery(rest as Record<string, string | number | boolean | undefined>)}`,
    );
    return { items: data.items, meta: meta ?? emptyMeta(params.page, params.limit) };
  },

  createComment: (body: CommentCreateBody) =>
    apiClient.post<ProjectComment>(`${base}/${body.projectId}/comments`, body),

  updateComment: (id: string, body: CommentUpdateBody) =>
    apiClient.patch<ProjectComment>(`${base}/comments/${id}`, body),

  deleteComment: (id: string) =>
    apiClient.delete<{ id: string }>(`${base}/comments/${id}`),

  resolveComment: (id: string) =>
    apiClient.post<ProjectComment>(`${base}/comments/${id}/resolve`, {}),

  facultyDashboard: () =>
    apiClient.get<ProjectFacultyDashboard>(`${base}/dashboard/faculty`),

  studentDashboard: () =>
    apiClient.get<ProjectStudentDashboard>(`${base}/dashboard/student`),

  institutionDashboard: () =>
    apiClient.get<ProjectInstitutionDashboard>(`${base}/dashboard/institution`),

  stats: () => apiClient.get<ProjectInstitutionDashboard>(`${base}/stats`),
};
