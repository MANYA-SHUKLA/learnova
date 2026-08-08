'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { assignmentApi } from '../services/assignment-api';
import type {
  AssignmentCreateBody,
  AssignmentListParams,
  AssignmentUpdateBody,
  GradeBody,
  SubmissionListParams,
  SubmitBody,
} from '../types';

export const assignmentKeys = {
  all: ['assignments'] as const,
  lists: () => [...assignmentKeys.all, 'list'] as const,
  list: (params: AssignmentListParams) => [...assignmentKeys.lists(), params] as const,
  mine: (params: AssignmentListParams) => [...assignmentKeys.all, 'mine', params] as const,
  detail: (id: string) => [...assignmentKeys.all, 'detail', id] as const,
  submissions: (params: SubmissionListParams) =>
    [...assignmentKeys.all, 'submissions', params] as const,
  comments: (id: string) => [...assignmentKeys.all, 'comments', id] as const,
  facultyDash: () => [...assignmentKeys.all, 'dash', 'faculty'] as const,
  studentDash: () => [...assignmentKeys.all, 'dash', 'student'] as const,
  institutionDash: () => [...assignmentKeys.all, 'dash', 'institution'] as const,
};

export function useAssignmentList(params: AssignmentListParams = {}, enabled = true) {
  return useQuery({
    queryKey: assignmentKeys.list(params),
    queryFn: () => assignmentApi.list(params),
    enabled,
    staleTime: 30_000,
    refetchOnMount: 'always',
  });
}

export function useMyAssignments(params: AssignmentListParams = {}, enabled = true) {
  return useQuery({
    queryKey: assignmentKeys.mine(params),
    queryFn: () => assignmentApi.listMine(params),
    enabled,
    staleTime: 30_000,
    refetchOnMount: 'always',
  });
}

export function useAssignment(id: string, enabled = true) {
  return useQuery({
    queryKey: assignmentKeys.detail(id),
    queryFn: () => assignmentApi.get(id),
    enabled: enabled && Boolean(id),
    staleTime: 30_000,
  });
}

export function useSubmissionList(params: SubmissionListParams = {}, enabled = true) {
  return useQuery({
    queryKey: assignmentKeys.submissions(params),
    queryFn: () => assignmentApi.listSubmissions(params),
    enabled,
    staleTime: 30_000,
    refetchOnMount: 'always',
  });
}

export function useFacultyAssignmentDashboard(enabled = true) {
  return useQuery({
    queryKey: assignmentKeys.facultyDash(),
    queryFn: () => assignmentApi.facultyDashboard(),
    enabled,
    staleTime: 60_000,
  });
}

export function useStudentAssignmentDashboard(enabled = true) {
  return useQuery({
    queryKey: assignmentKeys.studentDash(),
    queryFn: () => assignmentApi.studentDashboard(),
    enabled,
    staleTime: 60_000,
  });
}

export function useInstitutionAssignmentDashboard(enabled = true) {
  return useQuery({
    queryKey: assignmentKeys.institutionDash(),
    queryFn: () => assignmentApi.institutionDashboard(),
    enabled,
    staleTime: 60_000,
  });
}

export function useAssignmentComments(assignmentId: string, enabled = true) {
  return useQuery({
    queryKey: assignmentKeys.comments(assignmentId),
    queryFn: () => assignmentApi.listComments(assignmentId),
    enabled: enabled && Boolean(assignmentId),
  });
}

export function useCreateAssignmentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AssignmentCreateBody) => assignmentApi.create(body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: assignmentKeys.all });
    },
  });
}

export function useUpdateAssignmentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: AssignmentUpdateBody }) =>
      assignmentApi.update(id, body),
    onSuccess: async (_data, vars) => {
      await qc.invalidateQueries({ queryKey: assignmentKeys.detail(vars.id) });
      await qc.invalidateQueries({ queryKey: assignmentKeys.lists() });
    },
  });
}

export function usePublishAssignmentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => assignmentApi.publish(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: assignmentKeys.all });
    },
  });
}

export function useArchiveAssignmentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => assignmentApi.archive(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: assignmentKeys.all });
    },
  });
}

export function useCloseAssignmentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => assignmentApi.close(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: assignmentKeys.all });
    },
  });
}

export function useSubmitAssignmentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: SubmitBody) => assignmentApi.submit(body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: assignmentKeys.all });
    },
  });
}

export function useSaveDraftMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: SubmitBody) => assignmentApi.saveDraft(body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: assignmentKeys.all });
    },
  });
}

export function useGradeSubmissionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: GradeBody }) => assignmentApi.grade(id, body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: assignmentKeys.all });
    },
  });
}

export function useAddCommentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      assignmentId,
      body,
    }: {
      assignmentId: string;
      body: { body: string; submissionId?: string | null; parentCommentId?: string | null };
    }) => assignmentApi.addComment(assignmentId, body),
    onSuccess: async (_d, vars) => {
      await qc.invalidateQueries({ queryKey: assignmentKeys.comments(vars.assignmentId) });
    },
  });
}
