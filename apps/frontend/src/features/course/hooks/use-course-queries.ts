'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { courseApi } from '../services/course-api';
import type {
  CourseCreateBody,
  CourseListParams,
  CourseUpdateBody,
} from '../types';

export const courseKeys = {
  all: ['course'] as const,
  lists: () => [...courseKeys.all, 'list'] as const,
  list: (params?: CourseListParams) => [...courseKeys.lists(), params] as const,
  stats: () => [...courseKeys.all, 'stats'] as const,
  detail: (id: string) => [...courseKeys.all, 'detail', id] as const,
  audit: (courseId?: string) => [...courseKeys.all, 'audit', courseId] as const,
};

export function useCourseList(params?: CourseListParams, enabled = true) {
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

export function useCourseAudit(courseId?: string, enabled = true) {
  return useQuery({
    queryKey: courseKeys.audit(courseId),
    queryFn: () => courseApi.audit(courseId),
    enabled,
  });
}

function invalidateCourse(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: courseKeys.all });
}

export function useCreateCourseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CourseCreateBody) => courseApi.create(body),
    onSuccess: () => invalidateCourse(queryClient),
  });
}

export function useUpdateCourseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: CourseUpdateBody }) =>
      courseApi.update(id, body),
    onSuccess: (data) => {
      queryClient.setQueryData(courseKeys.detail(data.id), data);
      invalidateCourse(queryClient);
    },
  });
}

export function useArchiveCourseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => courseApi.archive(id),
    onSuccess: () => invalidateCourse(queryClient),
  });
}

export function useRestoreCourseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => courseApi.restore(id),
    onSuccess: () => invalidateCourse(queryClient),
  });
}

export function usePublishCourseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => courseApi.publish(id),
    onSuccess: () => invalidateCourse(queryClient),
  });
}

export function useUnpublishCourseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => courseApi.unpublish(id),
    onSuccess: () => invalidateCourse(queryClient),
  });
}

export function useDuplicateCourseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => courseApi.duplicate(id),
    onSuccess: () => invalidateCourse(queryClient),
  });
}

export function useBulkArchiveCourseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => courseApi.bulkArchive({ ids }),
    onSuccess: () => invalidateCourse(queryClient),
  });
}

export function useBulkPublishCourseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => courseApi.bulkPublish({ ids }),
    onSuccess: () => invalidateCourse(queryClient),
  });
}

export function useBulkUnpublishCourseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => courseApi.bulkUnpublish({ ids }),
    onSuccess: () => invalidateCourse(queryClient),
  });
}

export function useCourseImportMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rows: Array<Record<string, string>>) => courseApi.import(rows, false),
    onSuccess: () => invalidateCourse(queryClient),
  });
}

export function useCourseThumbnailUploadMutation() {
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
    }) => courseApi.uploadThumbnail(id, { contentType, data }),
    onSuccess: (data) => {
      queryClient.setQueryData(courseKeys.detail(data.id), data);
      invalidateCourse(queryClient);
    },
  });
}
