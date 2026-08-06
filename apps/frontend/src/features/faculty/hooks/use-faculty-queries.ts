'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { facultyApi } from '../services/faculty-api';
import type {
  FacultyCreateBody,
  FacultyListParams,
  FacultyUpdateBody,
  FacultyUpdateProfileBody,
} from '../types';

export const facultyKeys = {
  all: ['faculty'] as const,
  lists: () => [...facultyKeys.all, 'list'] as const,
  list: (params?: FacultyListParams) => [...facultyKeys.lists(), params] as const,
  stats: () => [...facultyKeys.all, 'stats'] as const,
  detail: (id: string) => [...facultyKeys.all, 'detail', id] as const,
  me: () => [...facultyKeys.all, 'me'] as const,
  audit: (facultyId?: string) => [...facultyKeys.all, 'audit', facultyId] as const,
};

export function useFacultyList(params?: FacultyListParams, enabled = true) {
  return useQuery({
    queryKey: facultyKeys.list(params),
    queryFn: () => facultyApi.list(params),
    enabled,
    staleTime: 30_000,
  });
}

export function useFacultyStats(enabled = true) {
  return useQuery({
    queryKey: facultyKeys.stats(),
    queryFn: () => facultyApi.stats(),
    enabled,
    staleTime: 60_000,
  });
}

export function useFaculty(id: string, enabled = true) {
  return useQuery({
    queryKey: facultyKeys.detail(id),
    queryFn: () => facultyApi.get(id),
    enabled: enabled && Boolean(id),
  });
}

export function useMyFacultyProfile(enabled = true) {
  return useQuery({
    queryKey: facultyKeys.me(),
    queryFn: () => facultyApi.getMe(),
    enabled,
  });
}

export function useFacultyAudit(facultyId?: string, enabled = true) {
  return useQuery({
    queryKey: facultyKeys.audit(facultyId),
    queryFn: () => facultyApi.audit(facultyId),
    enabled,
  });
}

function invalidateFaculty(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: facultyKeys.all });
}

export function useCreateFacultyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: FacultyCreateBody) => facultyApi.create(body),
    onSuccess: () => invalidateFaculty(queryClient),
  });
}

export function useUpdateFacultyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: FacultyUpdateBody }) =>
      facultyApi.update(id, body),
    onSuccess: (data) => {
      queryClient.setQueryData(facultyKeys.detail(data.id), data);
      invalidateFaculty(queryClient);
    },
  });
}

export function useUpdateMyFacultyProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: FacultyUpdateProfileBody) => facultyApi.updateMe(body),
    onSuccess: (data) => {
      queryClient.setQueryData(facultyKeys.me(), data);
      queryClient.setQueryData(facultyKeys.detail(data.id), data);
      invalidateFaculty(queryClient);
    },
  });
}

export function useArchiveFacultyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => facultyApi.archive(id),
    onSuccess: () => invalidateFaculty(queryClient),
  });
}

export function useRestoreFacultyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => facultyApi.restore(id),
    onSuccess: () => invalidateFaculty(queryClient),
  });
}

export function useBulkArchiveFacultyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => facultyApi.bulkArchive({ ids }),
    onSuccess: () => invalidateFaculty(queryClient),
  });
}

export function useBulkActivateFacultyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => facultyApi.bulkActivate({ ids }),
    onSuccess: () => invalidateFaculty(queryClient),
  });
}

export function useBulkSuspendFacultyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => facultyApi.bulkSuspend({ ids }),
    onSuccess: () => invalidateFaculty(queryClient),
  });
}

export function useFacultyImportMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rows: Array<Record<string, string>>) => facultyApi.import(rows, false),
    onSuccess: () => invalidateFaculty(queryClient),
  });
}

export function useFacultyPhotoUploadMutation() {
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
    }) => facultyApi.uploadPhoto(id, { contentType, data }),
    onSuccess: (data) => {
      queryClient.setQueryData(facultyKeys.detail(data.id), data);
      invalidateFaculty(queryClient);
    },
  });
}
