'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectApi } from '../services/project-api';
import type {
  BulkAssignFacultyBody,
  BulkIdsBody,
  CommentCreateBody,
  CommentListParams,
  CommentUpdateBody,
  GradeBody,
  JoinTeamBody,
  MilestoneCreateBody,
  MilestoneUpdateBody,
  ProjectCreateBody,
  ProjectListParams,
  ProjectUpdateBody,
  ReviewCreateBody,
  ReviewSubmitBody,
  SubmissionListParams,
  SubmitBody,
  TeamCreateBody,
  TeamInviteBody,
  TeamListParams,
  TeamRejectBody,
  TeamTransferLeadershipBody,
  TeamUpdateBody,
} from '../types';

export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (params: ProjectListParams) => [...projectKeys.lists(), params] as const,
  mine: (params: ProjectListParams) => [...projectKeys.all, 'mine', params] as const,
  detail: (id: string) => [...projectKeys.all, 'detail', id] as const,
  milestones: (projectId: string) => [...projectKeys.all, 'milestones', projectId] as const,
  teams: (params: TeamListParams) => [...projectKeys.all, 'teams', params] as const,
  team: (id: string) => [...projectKeys.all, 'team', id] as const,
  myTeam: (params: { page?: number; limit?: number }) =>
    [...projectKeys.all, 'my-team', params] as const,
  submissions: (params: SubmissionListParams) =>
    [...projectKeys.all, 'submissions', params] as const,
  submission: (id: string) => [...projectKeys.all, 'submission', id] as const,
  comments: (params: CommentListParams) => [...projectKeys.all, 'comments', params] as const,
  review: (id: string) => [...projectKeys.all, 'review', id] as const,
  categories: () => [...projectKeys.all, 'categories'] as const,
  tags: () => [...projectKeys.all, 'tags'] as const,
  facultyDash: () => [...projectKeys.all, 'dash', 'faculty'] as const,
  studentDash: () => [...projectKeys.all, 'dash', 'student'] as const,
  institutionDash: () => [...projectKeys.all, 'dash', 'institution'] as const,
};

export function useProjectList(params: ProjectListParams = {}, enabled = true) {
  return useQuery({
    queryKey: projectKeys.list(params),
    queryFn: () => projectApi.list(params),
    enabled,
    staleTime: 30_000,
    refetchOnMount: 'always',
  });
}

export function useMyProjects(params: ProjectListParams = {}, enabled = true) {
  return useQuery({
    queryKey: projectKeys.mine(params),
    queryFn: () => projectApi.listMine(params),
    enabled,
    staleTime: 30_000,
    refetchOnMount: 'always',
  });
}

export function useProject(id: string, enabled = true) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => projectApi.get(id),
    enabled: enabled && Boolean(id),
    staleTime: 30_000,
  });
}

export function useProjectCategories(enabled = true) {
  return useQuery({
    queryKey: projectKeys.categories(),
    queryFn: () => projectApi.listCategories(),
    enabled,
    staleTime: 120_000,
  });
}

export function useProjectTags(enabled = true) {
  return useQuery({
    queryKey: projectKeys.tags(),
    queryFn: () => projectApi.listTags(),
    enabled,
    staleTime: 120_000,
  });
}

export function useProjectMilestones(projectId: string, enabled = true) {
  return useQuery({
    queryKey: projectKeys.milestones(projectId),
    queryFn: () => projectApi.listMilestones(projectId),
    enabled: enabled && Boolean(projectId),
    staleTime: 30_000,
  });
}

export function useTeamList(params: TeamListParams = {}, enabled = true) {
  return useQuery({
    queryKey: projectKeys.teams(params),
    queryFn: () => projectApi.listTeams(params),
    enabled,
    staleTime: 30_000,
    refetchOnMount: 'always',
  });
}

export function useTeam(id: string, enabled = true) {
  return useQuery({
    queryKey: projectKeys.team(id),
    queryFn: () => projectApi.getTeam(id),
    enabled: enabled && Boolean(id),
    staleTime: 30_000,
  });
}

export function useMyTeamList(params: { page?: number; limit?: number } = {}, enabled = true) {
  return useQuery({
    queryKey: projectKeys.myTeam(params),
    queryFn: () => projectApi.myTeam(params),
    enabled,
    staleTime: 30_000,
    refetchOnMount: 'always',
  });
}

export function useSubmissionList(params: SubmissionListParams = {}, enabled = true) {
  return useQuery({
    queryKey: projectKeys.submissions(params),
    queryFn: () => projectApi.listSubmissions(params),
    enabled,
    staleTime: 30_000,
    refetchOnMount: 'always',
  });
}

export function useSubmission(id: string, enabled = true) {
  return useQuery({
    queryKey: projectKeys.submission(id),
    queryFn: () => projectApi.getSubmission(id),
    enabled: enabled && Boolean(id),
    staleTime: 30_000,
  });
}

export function useProjectComments(params: CommentListParams, enabled = true) {
  return useQuery({
    queryKey: projectKeys.comments(params),
    queryFn: () => projectApi.listComments(params),
    enabled: enabled && Boolean(params.projectId),
    staleTime: 15_000,
  });
}

export function useFacultyProjectDashboard(enabled = true) {
  return useQuery({
    queryKey: projectKeys.facultyDash(),
    queryFn: () => projectApi.facultyDashboard(),
    enabled,
    staleTime: 60_000,
  });
}

export function useStudentProjectDashboard(enabled = true) {
  return useQuery({
    queryKey: projectKeys.studentDash(),
    queryFn: () => projectApi.studentDashboard(),
    enabled,
    staleTime: 60_000,
  });
}

export function useInstitutionProjectDashboard(enabled = true) {
  return useQuery({
    queryKey: projectKeys.institutionDash(),
    queryFn: () => projectApi.institutionDashboard(),
    enabled,
    staleTime: 60_000,
  });
}

export function useCreateProjectMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ProjectCreateBody) => projectApi.create(body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useUpdateProjectMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: ProjectUpdateBody }) =>
      projectApi.update(id, body),
    onSuccess: async (_data, vars) => {
      await qc.invalidateQueries({ queryKey: projectKeys.detail(vars.id) });
      await qc.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

export function useDeleteProjectMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => projectApi.remove(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function usePublishProjectMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => projectApi.publish(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useArchiveProjectMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => projectApi.archive(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useCloseProjectMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => projectApi.close(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useDuplicateProjectMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => projectApi.duplicate(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useBulkPublishProjectsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: BulkIdsBody) => projectApi.bulkPublish(body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useBulkArchiveProjectsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: BulkIdsBody) => projectApi.bulkArchive(body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useBulkDeleteProjectsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: BulkIdsBody) => projectApi.bulkDelete(body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useBulkDuplicateProjectsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: BulkIdsBody) => projectApi.bulkDuplicate(body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useBulkAssignFacultyMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: BulkAssignFacultyBody) => projectApi.bulkAssignFaculty(body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useCreateMilestoneMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: MilestoneCreateBody) => projectApi.createMilestone(body),
    onSuccess: async (_data, vars) => {
      await qc.invalidateQueries({ queryKey: projectKeys.milestones(vars.projectId) });
    },
  });
}

export function useUpdateMilestoneMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; projectId: string; body: MilestoneUpdateBody }) =>
      projectApi.updateMilestone(id, body),
    onSuccess: async (_data, vars) => {
      await qc.invalidateQueries({ queryKey: projectKeys.milestones(vars.projectId) });
    },
  });
}

export function useDeleteMilestoneMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; projectId: string }) =>
      projectApi.deleteMilestone(id),
    onSuccess: async (_data, vars) => {
      await qc.invalidateQueries({ queryKey: projectKeys.milestones(vars.projectId) });
    },
  });
}

export function useCompleteMilestoneMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; projectId: string }) =>
      projectApi.completeMilestone(id),
    onSuccess: async (_data, vars) => {
      await qc.invalidateQueries({ queryKey: projectKeys.milestones(vars.projectId) });
    },
  });
}

export function useCreateTeamMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: TeamCreateBody) => projectApi.createTeam(body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useJoinTeamMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: JoinTeamBody) => projectApi.joinTeam(body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useUpdateTeamMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: TeamUpdateBody }) =>
      projectApi.updateTeam(id, body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useLeaveTeamMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => projectApi.leaveTeam(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useApproveTeamMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => projectApi.approveTeam(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useRejectTeamMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body?: TeamRejectBody }) =>
      projectApi.rejectTeam(id, body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useInviteToTeamMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: TeamInviteBody }) =>
      projectApi.inviteToTeam(id, body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useTransferTeamLeadershipMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: TeamTransferLeadershipBody }) =>
      projectApi.transferTeamLeadership(id, body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useAcceptInvitationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) => projectApi.acceptInvitation(invitationId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useRejectInvitationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) => projectApi.rejectInvitation(invitationId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useSaveDraftMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: SubmitBody) => projectApi.saveDraft(body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useSubmitProjectMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: SubmitBody) => projectApi.submit(body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useGradeSubmissionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: GradeBody }) => projectApi.grade(id, body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useCreateReviewMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ReviewCreateBody) => projectApi.createReview(body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useSubmitReviewMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: ReviewSubmitBody }) =>
      projectApi.submitReview(id, body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useCreateCommentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CommentCreateBody) => projectApi.createComment(body),
    onSuccess: async (_data, vars) => {
      await qc.invalidateQueries({
        queryKey: [...projectKeys.all, 'comments'],
      });
      await qc.invalidateQueries({ queryKey: projectKeys.detail(vars.projectId) });
    },
  });
}

export function useUpdateCommentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; projectId: string; body: CommentUpdateBody }) =>
      projectApi.updateComment(id, body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: [...projectKeys.all, 'comments'] });
    },
  });
}

export function useDeleteCommentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; projectId: string }) =>
      projectApi.deleteComment(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: [...projectKeys.all, 'comments'] });
    },
  });
}

export function useResolveCommentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; projectId: string }) =>
      projectApi.resolveComment(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: [...projectKeys.all, 'comments'] });
    },
  });
}
