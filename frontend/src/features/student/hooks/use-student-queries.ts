'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { studentApi } from '../services/student-api';
import type {
  StudentCreateBody,
  StudentListParams,
  StudentUpdateBody,
  StudentUpdateProfileBody,
} from '../types';

export const studentKeys = {
  all: ['student'] as const,
  lists: () => [...studentKeys.all, 'list'] as const,
  list: (params?: StudentListParams) => [...studentKeys.lists(), params] as const,
  stats: () => [...studentKeys.all, 'stats'] as const,
  detail: (id: string) => [...studentKeys.all, 'detail', id] as const,
  me: () => [...studentKeys.all, 'me'] as const,
  audit: (studentId?: string) => [...studentKeys.all, 'audit', studentId] as const,
};

export function useStudentList(params?: StudentListParams, enabled = true) {
  return useQuery({
    queryKey: studentKeys.list(params),
    queryFn: () => studentApi.list(params),
    enabled,
    staleTime: 30_000,
    refetchOnMount: 'always',
  });
}

export function useStudentStats(enabled = true) {
  return useQuery({
    queryKey: studentKeys.stats(),
    queryFn: () => studentApi.stats(),
    enabled,
    staleTime: 60_000,
  });
}

export function useStudent(id: string, enabled = true) {
  return useQuery({
    queryKey: studentKeys.detail(id),
    queryFn: () => studentApi.get(id),
    enabled: enabled && Boolean(id),
  });
}

export function useMyStudentProfile(enabled = true) {
  return useQuery({
    queryKey: studentKeys.me(),
    queryFn: () => studentApi.getMe(),
    enabled,
  });
}

export function useStudentAudit(studentId?: string, enabled = true) {
  return useQuery({
    queryKey: studentKeys.audit(studentId),
    queryFn: () => studentApi.audit(studentId),
    enabled,
  });
}

function invalidateStudent(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: studentKeys.all });
}

export function useCreateStudentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: StudentCreateBody) => studentApi.create(body),
    onSuccess: () => { invalidateStudent(queryClient); },
  });
}

export function useUpdateStudentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: StudentUpdateBody }) =>
      studentApi.update(id, body),
    onSuccess: (data) => {
      queryClient.setQueryData(studentKeys.detail(data.id), data);
      invalidateStudent(queryClient);
    },
  });
}

export function useUpdateMyStudentProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: StudentUpdateProfileBody) => studentApi.updateMe(body),
    onSuccess: (data) => {
      queryClient.setQueryData(studentKeys.me(), data);
      queryClient.setQueryData(studentKeys.detail(data.id), data);
      invalidateStudent(queryClient);
    },
  });
}

export function useArchiveStudentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => studentApi.archive(id),
    onSuccess: () => { invalidateStudent(queryClient); },
  });
}

export function useRestoreStudentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => studentApi.restore(id),
    onSuccess: () => { invalidateStudent(queryClient); },
  });
}

export function useActivateStudentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => studentApi.activate(id),
    onSuccess: () => { invalidateStudent(queryClient); },
  });
}

export function useDeactivateStudentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => studentApi.deactivate(id),
    onSuccess: () => { invalidateStudent(queryClient); },
  });
}

export function useBulkArchiveStudentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => studentApi.bulkArchive({ ids }),
    onSuccess: () => { invalidateStudent(queryClient); },
  });
}

export function useBulkActivateStudentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => studentApi.bulkActivate({ ids }),
    onSuccess: () => { invalidateStudent(queryClient); },
  });
}

export function useBulkSuspendStudentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => studentApi.bulkSuspend({ ids }),
    onSuccess: () => { invalidateStudent(queryClient); },
  });
}

export function useStudentImportMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rows: Record<string, string>[]) => studentApi.import(rows, false),
    onSuccess: () => { invalidateStudent(queryClient); },
  });
}

export function useStudentPhotoUploadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      contentType,
      data,
    }: {
      id: string;
      contentType: 'image/jpeg' | 'image/png' | 'image/webp';
      data: string;
    }) => studentApi.uploadPhoto(id, { contentType, data }),
    onSuccess: (data) => {
      queryClient.setQueryData(studentKeys.detail(data.id), data);
      invalidateStudent(queryClient);
    },
  });
}
