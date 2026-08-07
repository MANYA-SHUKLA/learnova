'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { practiceLabApi } from '../services/practice-lab-api';
import type {
  CreatePracticeLabBody,
  CreateProblemBody,
  PracticeLabListParams,
  ProblemListParams,
  RunCodeBody,
  SubmissionListParams,
  SubmitBody,
} from '../types';

export const practiceLabKeys = {
  all: ['practice-labs'] as const,
  lists: () => [...practiceLabKeys.all, 'list'] as const,
  list: (params: PracticeLabListParams) => [...practiceLabKeys.lists(), params] as const,
  detail: (id: string) => [...practiceLabKeys.all, 'detail', id] as const,
  problems: (params: ProblemListParams) => [...practiceLabKeys.all, 'problems', params] as const,
  problem: (id: string) => [...practiceLabKeys.all, 'problem', id] as const,
  submissions: (params: SubmissionListParams) =>
    [...practiceLabKeys.all, 'submissions', params] as const,
  facultyDash: () => [...practiceLabKeys.all, 'dash', 'faculty'] as const,
  studentDash: () => [...practiceLabKeys.all, 'dash', 'student'] as const,
  institutionDash: () => [...practiceLabKeys.all, 'dash', 'institution'] as const,
  languages: () => [...practiceLabKeys.all, 'languages'] as const,
  leaderboard: (params: Record<string, string | number | undefined>) =>
    [...practiceLabKeys.all, 'leaderboard', params] as const,
};

export function usePracticeLabList(params: PracticeLabListParams = {}, enabled = true) {
  return useQuery({
    queryKey: practiceLabKeys.list(params),
    queryFn: () => practiceLabApi.list(params),
    enabled,
    staleTime: 30_000,
    refetchOnMount: 'always',
  });
}

export function usePracticeLab(id: string, enabled = true) {
  return useQuery({
    queryKey: practiceLabKeys.detail(id),
    queryFn: () => practiceLabApi.get(id),
    enabled: enabled && Boolean(id),
  });
}

export function useProblemList(params: ProblemListParams = {}, enabled = true) {
  return useQuery({
    queryKey: practiceLabKeys.problems(params),
    queryFn: () => practiceLabApi.listProblems(params),
    enabled,
    staleTime: 30_000,
  });
}

export function useLabProblem(id: string, enabled = true) {
  return useQuery({
    queryKey: practiceLabKeys.problem(id),
    queryFn: () => practiceLabApi.getProblem(id),
    enabled: enabled && Boolean(id),
  });
}

export function useSubmissionList(params: SubmissionListParams = {}, enabled = true) {
  return useQuery({
    queryKey: practiceLabKeys.submissions(params),
    queryFn: () => practiceLabApi.listSubmissions(params),
    enabled,
    staleTime: 30_000,
  });
}

export function useInstitutionPracticeDashboard(enabled = true) {
  return useQuery({
    queryKey: practiceLabKeys.institutionDash(),
    queryFn: () => practiceLabApi.institutionDashboard(),
    enabled,
    staleTime: 60_000,
  });
}

export function useFacultyPracticeDashboard(enabled = true) {
  return useQuery({
    queryKey: practiceLabKeys.facultyDash(),
    queryFn: () => practiceLabApi.facultyDashboard(),
    enabled,
    staleTime: 60_000,
  });
}

export function useStudentPracticeDashboard(enabled = true) {
  return useQuery({
    queryKey: practiceLabKeys.studentDash(),
    queryFn: () => practiceLabApi.studentDashboard(),
    enabled,
    staleTime: 60_000,
  });
}

export function usePracticeLanguages(enabled = true) {
  return useQuery({
    queryKey: practiceLabKeys.languages(),
    queryFn: () => practiceLabApi.languages(),
    enabled,
    staleTime: 300_000,
  });
}

export function useCreatePracticeLabMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreatePracticeLabBody) => practiceLabApi.create(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: practiceLabKeys.lists() });
    },
  });
}

export function usePublishPracticeLabMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => practiceLabApi.publish(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: practiceLabKeys.all });
    },
  });
}

export function useArchivePracticeLabMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => practiceLabApi.archive(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: practiceLabKeys.all });
    },
  });
}

export function useCreateProblemMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateProblemBody) => practiceLabApi.createProblem(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: practiceLabKeys.all });
    },
  });
}

export function useRunCodeMutation() {
  return useMutation({
    mutationFn: (body: RunCodeBody) => practiceLabApi.run(body),
  });
}

export function useSubmitSolutionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: SubmitBody) => practiceLabApi.submit(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: practiceLabKeys.all });
    },
  });
}
