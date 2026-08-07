'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { examinationApi } from '../services/examination-api';
import type {
  AssignSeatingBody,
  BulkActionBody,
  CheckInBody,
  ExamCreateBody,
  ExamListParams,
  ProctorEventBody,
  StartAttemptBody,
  SubmitExamBody,
} from '../types';

export const examinationKeys = {
  all: ['examinations'] as const,
  lists: () => [...examinationKeys.all, 'list'] as const,
  list: (params: ExamListParams) => [...examinationKeys.lists(), params] as const,
  detail: (id: string) => [...examinationKeys.all, 'detail', id] as const,
  analytics: (id: string) => [...examinationKeys.all, 'analytics', id] as const,
  seating: (id: string) => [...examinationKeys.all, 'seating', id] as const,
  attempts: (params: { examId?: string; page?: number; limit?: number }) =>
    [...examinationKeys.all, 'attempts', params] as const,
  facultyDash: () => [...examinationKeys.all, 'dash', 'faculty'] as const,
  studentDash: () => [...examinationKeys.all, 'dash', 'student'] as const,
  institutionDash: () => [...examinationKeys.all, 'dash', 'institution'] as const,
};

export function useExamList(params: ExamListParams = {}, enabled = true) {
  return useQuery({
    queryKey: examinationKeys.list(params),
    queryFn: () => examinationApi.list(params),
    enabled,
    staleTime: 30_000,
  });
}

export function useExam(id: string, enabled = true) {
  return useQuery({
    queryKey: examinationKeys.detail(id),
    queryFn: () => examinationApi.get(id),
    enabled: enabled && Boolean(id),
    staleTime: 30_000,
  });
}

export function useFacultyExamDashboard(enabled = true) {
  return useQuery({
    queryKey: examinationKeys.facultyDash(),
    queryFn: () => examinationApi.facultyDashboard(),
    enabled,
    staleTime: 60_000,
  });
}

export function useStudentExamDashboard(enabled = true) {
  return useQuery({
    queryKey: examinationKeys.studentDash(),
    queryFn: () => examinationApi.studentDashboard(),
    enabled,
    staleTime: 60_000,
  });
}

export function useInstitutionExamDashboard(enabled = true) {
  return useQuery({
    queryKey: examinationKeys.institutionDash(),
    queryFn: () => examinationApi.institutionDashboard(),
    enabled,
    staleTime: 60_000,
  });
}

export function usePublishExamMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => examinationApi.publish(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: examinationKeys.lists() }),
  });
}

export function useCheckInExamMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CheckInBody) => examinationApi.checkIn(body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: examinationKeys.studentDash() }),
  });
}

export function useStartExamAttemptMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: StartAttemptBody) => examinationApi.startAttempt(body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: examinationKeys.studentDash() }),
  });
}

export function useSubmitExamMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: SubmitExamBody) => examinationApi.submitExam(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: examinationKeys.studentDash() });
      void qc.invalidateQueries({ queryKey: examinationKeys.attempts({}) });
    },
  });
}

export function useProctorEventMutation() {
  return useMutation({
    mutationFn: (body: ProctorEventBody) => examinationApi.logProctorEvent(body),
  });
}

export function useTerminateAttemptMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (attemptId: string) => examinationApi.terminateAttempt(attemptId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: examinationKeys.attempts({}) }),
  });
}

export function useCreateExamMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ExamCreateBody) => examinationApi.create(body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: examinationKeys.lists() }),
  });
}

export function useBulkExamMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: BulkActionBody) => examinationApi.bulk(body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: examinationKeys.lists() }),
  });
}

export function useAssignSeatingMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AssignSeatingBody) => examinationApi.assignSeating(body),
    onSuccess: (_d, body) =>
      void qc.invalidateQueries({ queryKey: examinationKeys.seating(body.examId) }),
  });
}
