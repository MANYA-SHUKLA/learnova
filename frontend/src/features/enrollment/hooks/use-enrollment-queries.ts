'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { enrollmentApi } from '../services/enrollment-api';
import type {
  EnrollmentBulkApproveBody,
  EnrollmentBulkRejectBody,
  EnrollmentCreateBody,
  EnrollmentListParams,
  EnrollmentSelfEnrollBody,
  EnrollmentUpdateBody,
} from '../types';

export const enrollmentKeys = {
  all: ['enrollment'] as const,
  lists: () => [...enrollmentKeys.all, 'list'] as const,
  list: (params?: EnrollmentListParams) => [...enrollmentKeys.lists(), params] as const,
  stats: () => [...enrollmentKeys.all, 'stats'] as const,
  detail: (id: string) => [...enrollmentKeys.all, 'detail', id] as const,
  me: (params?: EnrollmentListParams) => [...enrollmentKeys.all, 'me', params] as const,
  waitlist: () => [...enrollmentKeys.all, 'waitlist'] as const,
};

export function useEnrollmentList(params?: EnrollmentListParams, enabled = true) {
  return useQuery({
    queryKey: enrollmentKeys.list(params),
    queryFn: () => enrollmentApi.list(params),
    enabled,
    staleTime: 30_000,
    refetchOnMount: 'always',
  });
}

export function useEnrollmentStats(enabled = true) {
  return useQuery({
    queryKey: enrollmentKeys.stats(),
    queryFn: () => enrollmentApi.stats(),
    enabled,
    staleTime: 60_000,
  });
}

export function useEnrollment(id: string, enabled = true) {
  return useQuery({
    queryKey: enrollmentKeys.detail(id),
    queryFn: () => enrollmentApi.get(id),
    enabled: enabled && Boolean(id),
  });
}

export function useMyEnrollments(params?: EnrollmentListParams, enabled = true) {
  return useQuery({
    queryKey: enrollmentKeys.me(params),
    queryFn: () => enrollmentApi.getMyEnrollments(params),
    enabled,
    staleTime: 30_000,
  });
}

export function useWaitlist(enabled = true) {
  return useQuery({
    queryKey: enrollmentKeys.waitlist(),
    queryFn: () => enrollmentApi.waitlist(),
    enabled,
  });
}

function invalidateEnrollment(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: enrollmentKeys.all });
}

export function useCreateEnrollmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: EnrollmentCreateBody) => enrollmentApi.create(body),
    onSuccess: () => invalidateEnrollment(queryClient),
  });
}

export function useUpdateEnrollmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: EnrollmentUpdateBody }) =>
      enrollmentApi.update(id, body),
    onSuccess: (data) => {
      queryClient.setQueryData(enrollmentKeys.detail(data.id), data);
      invalidateEnrollment(queryClient);
    },
  });
}

export function useApproveEnrollmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => enrollmentApi.approve(id),
    onSuccess: (data) => {
      queryClient.setQueryData(enrollmentKeys.detail(data.id), data);
      invalidateEnrollment(queryClient);
    },
  });
}

export function useRejectEnrollmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      enrollmentApi.reject(id, reason),
    onSuccess: (data) => {
      queryClient.setQueryData(enrollmentKeys.detail(data.id), data);
      invalidateEnrollment(queryClient);
    },
  });
}

export function useWithdrawEnrollmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      enrollmentApi.withdraw(id, reason),
    onSuccess: (data) => {
      queryClient.setQueryData(enrollmentKeys.detail(data.id), data);
      invalidateEnrollment(queryClient);
    },
  });
}

export function useCompleteEnrollmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => enrollmentApi.complete(id),
    onSuccess: (data) => {
      queryClient.setQueryData(enrollmentKeys.detail(data.id), data);
      invalidateEnrollment(queryClient);
    },
  });
}

export function useArchiveEnrollmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => enrollmentApi.archive(id),
    onSuccess: () => invalidateEnrollment(queryClient),
  });
}

export function useRestoreEnrollmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => enrollmentApi.restore(id),
    onSuccess: () => invalidateEnrollment(queryClient),
  });
}

export function useBulkApproveEnrollmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: EnrollmentBulkApproveBody) => enrollmentApi.bulkApprove(body),
    onSuccess: () => invalidateEnrollment(queryClient),
  });
}

export function useBulkRejectEnrollmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: EnrollmentBulkRejectBody) => enrollmentApi.bulkReject(body),
    onSuccess: () => invalidateEnrollment(queryClient),
  });
}

export function useBulkArchiveEnrollmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => enrollmentApi.bulkArchive({ ids }),
    onSuccess: () => invalidateEnrollment(queryClient),
  });
}

export function useSelfEnrollMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: EnrollmentSelfEnrollBody) => enrollmentApi.selfEnroll(body),
    onSuccess: () => invalidateEnrollment(queryClient),
  });
}

export function useLeaveWaitlistMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => enrollmentApi.leaveWaitlist(courseId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: enrollmentKeys.waitlist() });
    },
  });
}

export function useEnrollmentImportMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rows: Array<Record<string, string>>) => enrollmentApi.import(rows, false),
    onSuccess: () => invalidateEnrollment(queryClient),
  });
}
