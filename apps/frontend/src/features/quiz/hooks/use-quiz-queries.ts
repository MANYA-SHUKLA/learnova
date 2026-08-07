'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { quizApi } from '../services/quiz-api';
import type {
  BulkActionBody,
  QuestionCreateBody,
  QuestionListParams,
  QuestionUpdateBody,
  QuizCreateBody,
  QuizListParams,
  QuizUpdateBody,
  StartAttemptBody,
  SubmitAnswerBody,
  SubmitQuizBody,
} from '../types';

export const quizKeys = {
  all: ['quizzes'] as const,
  lists: () => [...quizKeys.all, 'list'] as const,
  list: (params: QuizListParams) => [...quizKeys.lists(), params] as const,
  detail: (id: string) => [...quizKeys.all, 'detail', id] as const,
  analytics: (id: string) => [...quizKeys.all, 'analytics', id] as const,
  banks: () => [...quizKeys.all, 'banks'] as const,
  questions: (params: QuestionListParams) => [...quizKeys.all, 'questions', params] as const,
  categories: () => [...quizKeys.all, 'categories'] as const,
  tags: () => [...quizKeys.all, 'tags'] as const,
  attempts: (params: { quizId?: string; page?: number; limit?: number }) =>
    [...quizKeys.all, 'attempts', params] as const,
  attempt: (id: string) => [...quizKeys.all, 'attempt', id] as const,
  facultyDash: () => [...quizKeys.all, 'dash', 'faculty'] as const,
  studentDash: () => [...quizKeys.all, 'dash', 'student'] as const,
  institutionDash: () => [...quizKeys.all, 'dash', 'institution'] as const,
};

export function useQuizList(params: QuizListParams = {}, enabled = true) {
  return useQuery({
    queryKey: quizKeys.list(params),
    queryFn: () => quizApi.list(params),
    enabled,
    staleTime: 30_000,
    refetchOnMount: 'always',
  });
}

export function useQuiz(id: string, enabled = true) {
  return useQuery({
    queryKey: quizKeys.detail(id),
    queryFn: () => quizApi.get(id),
    enabled: enabled && Boolean(id),
    staleTime: 30_000,
  });
}

export function useQuizAnalytics(id: string, enabled = true) {
  return useQuery({
    queryKey: quizKeys.analytics(id),
    queryFn: () => quizApi.getAnalytics(id),
    enabled: enabled && Boolean(id),
    staleTime: 60_000,
  });
}

export function useQuestionBanks(enabled = true) {
  return useQuery({
    queryKey: quizKeys.banks(),
    queryFn: () => quizApi.listBanks(),
    enabled,
    staleTime: 60_000,
  });
}

export function useQuestionList(params: QuestionListParams = {}, enabled = true) {
  return useQuery({
    queryKey: quizKeys.questions(params),
    queryFn: () => quizApi.listQuestions(params),
    enabled,
    staleTime: 30_000,
  });
}

export function useFacultyQuizDashboard(enabled = true) {
  return useQuery({
    queryKey: quizKeys.facultyDash(),
    queryFn: () => quizApi.facultyDashboard(),
    enabled,
    staleTime: 60_000,
  });
}

export function useStudentQuizDashboard(enabled = true) {
  return useQuery({
    queryKey: quizKeys.studentDash(),
    queryFn: () => quizApi.studentDashboard(),
    enabled,
    staleTime: 60_000,
  });
}

export function useInstitutionQuizDashboard(enabled = true) {
  return useQuery({
    queryKey: quizKeys.institutionDash(),
    queryFn: () => quizApi.institutionDashboard(),
    enabled,
    staleTime: 60_000,
  });
}

export function useQuizAttempts(
  params: { quizId?: string; page?: number; limit?: number } = {},
  enabled = true,
) {
  return useQuery({
    queryKey: quizKeys.attempts(params),
    queryFn: async () => {
      const { data, meta } = await quizApi.listAttempts(params);
      return { items: data.items, meta };
    },
    enabled,
    staleTime: 30_000,
  });
}

export function useCreateQuizMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: QuizCreateBody) => quizApi.create(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: quizKeys.lists() });
      void qc.invalidateQueries({ queryKey: quizKeys.facultyDash() });
      void qc.invalidateQueries({ queryKey: quizKeys.institutionDash() });
    },
  });
}

export function useUpdateQuizMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: QuizUpdateBody }) => quizApi.update(id, body),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: quizKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: quizKeys.lists() });
    },
  });
}

export function usePublishQuizMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => quizApi.publish(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: quizKeys.lists() }),
  });
}

export function useArchiveQuizMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => quizApi.archive(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: quizKeys.lists() }),
  });
}

export function useBulkQuizMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: BulkActionBody) => quizApi.bulk(body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: quizKeys.lists() }),
  });
}

export function useCreateQuestionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: QuestionCreateBody) => quizApi.createQuestion(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: quizKeys.questions({}) });
      void qc.invalidateQueries({ queryKey: quizKeys.banks() });
    },
  });
}

export function useUpdateQuestionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: QuestionUpdateBody }) =>
      quizApi.updateQuestion(id, body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: quizKeys.questions({}) }),
  });
}

export function useStartAttemptMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: StartAttemptBody) => quizApi.startAttempt(body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: quizKeys.studentDash() }),
  });
}

export function useSubmitQuizMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: SubmitQuizBody) => quizApi.submitQuiz(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: quizKeys.studentDash() });
      void qc.invalidateQueries({ queryKey: quizKeys.attempts({}) });
    },
  });
}

export function useSaveAnswerMutation() {
  return useMutation({
    mutationFn: ({ attemptId, body }: { attemptId: string; body: SubmitAnswerBody }) =>
      quizApi.saveAnswer(attemptId, body),
  });
}
