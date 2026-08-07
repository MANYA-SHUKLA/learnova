'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectApi } from '../services/project-api';
import type {
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
  TeamListParams,
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
  submissions: (params: SubmissionListParams) =>
    [...projectKeys.all, 'submissions', params] as const,
  submission: (id: string) => [...projectKeys.all, 'submission', id] as const,
  review: (id: string) => [...projectKeys.all, 'review', id] as const,
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
    mutationFn: ({ id, projectId, body }: { id: string; projectId: string; body: MilestoneUpdateBody }) =>
      projectApi.updateMilestone(id, body),
    onSuccess: async (_data, vars) => {
      await qc.invalidateQueries({ queryKey: projectKeys.milestones(vars.projectId) });
    },
  });
}

export function useDeleteMilestoneMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, projectId }: { id: string; projectId: string }) =>
      projectApi.deleteMilestone(id),
    onSuccess: async (_data, vars) => {
      await qc.invalidateQueries({ queryKey: projectKeys.milestones(vars.projectId) });
    },
  });
}

export function useCompleteMilestoneMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, projectId }: { id: string; projectId: string }) =>
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
