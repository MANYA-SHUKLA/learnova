'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseApi } from '../api';

export const courseKeys = {
  all: ['course'] as const,
  lists: () => [...courseKeys.all, 'list'] as const,
  list: (params?: Record<string, unknown>) => [...courseKeys.lists(), params] as const,
  stats: () => [...courseKeys.all, 'stats'] as const,
  detail: (id: string) => [...courseKeys.all, 'detail', id] as const,
};

export function useCourseList(params?: Record<string, unknown>, enabled = true) {
  return useQuery({
    queryKey: courseKeys.list(params),
    queryFn: () => courseApi.list(params),
    enabled,
    staleTime: 30_000,
  });
}

export function useCourseStats(enabled = true) {
  return useQuery({
    queryKey: courseKeys.stats(),
    queryFn: () => courseApi.stats(),
    enabled,
    staleTime: 60_000,
  });
}

export function useCourse(id: string, enabled = true) {
  return useQuery({
    queryKey: courseKeys.detail(id),
    queryFn: () => courseApi.get(id),
    enabled: enabled && Boolean(id),
  });
}

function invalidateCourses(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: courseKeys.all });
}

export function useCreateCourseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => courseApi.create(body),
    onSuccess: () => invalidateCourses(queryClient),
  });
}

export function useUpdateCourseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      courseApi.update(id, body),
    onSuccess: (data) => {
      queryClient.setQueryData(courseKeys.detail(data.id), data);
      invalidateCourses(queryClient);
    },
  });
}

export function useDeleteCourseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => courseApi.delete(id),
    onSuccess: () => invalidateCourses(queryClient),
  });
}

export function usePublishCourseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => courseApi.publish(id),
    onSuccess: (data) => {
      queryClient.setQueryData(courseKeys.detail(data.id), data);
      invalidateCourses(queryClient);
    },
  });
}

export function useArchiveCourseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => courseApi.archive(id),
    onSuccess: (data) => {
      queryClient.setQueryData(courseKeys.detail(data.id), data);
      invalidateCourses(queryClient);
    },
  });
}
