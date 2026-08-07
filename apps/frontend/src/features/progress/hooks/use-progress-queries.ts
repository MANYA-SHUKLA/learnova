'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { progressApi } from '../services/progress-api';
import type {
  ActivityListParams,
  BookmarkListParams,
  BookmarkListResult,
  CompleteLessonBody,
  CreateBookmarkBody,
  CreateNoteBody,
  NoteListParams,
  NoteListResult,
  OpenLessonBody,
  ProgressListParams,
  UpdateLessonProgressBody,
  UpdateNoteBody,
} from '../types';

export const progressKeys = {
  all: ['progress'] as const,
  lists: () => [...progressKeys.all, 'list'] as const,
  list: (params?: ProgressListParams) => [...progressKeys.lists(), params] as const,
  course: (courseId: string) => [...progressKeys.all, 'course', courseId] as const,
  resume: (courseId: string) => [...progressKeys.all, 'resume', courseId] as const,
  bookmarks: (params?: BookmarkListParams) =>
    [...progressKeys.all, 'bookmarks', params] as const,
  notes: (params?: NoteListParams) => [...progressKeys.all, 'notes', params] as const,
  activity: (params?: ActivityListParams) =>
    [...progressKeys.all, 'activity', params] as const,
  studentDashboard: () => [...progressKeys.all, 'dashboard', 'student'] as const,
  facultyDashboard: (courseId: string) =>
    [...progressKeys.all, 'dashboard', 'faculty', courseId] as const,
  institutionDashboard: () => [...progressKeys.all, 'dashboard', 'institution'] as const,
  stats: () => [...progressKeys.all, 'stats'] as const,
};

function invalidateProgress(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: progressKeys.all });
}

export function useMyProgress(params?: ProgressListParams, enabled = true) {
  return useQuery({
    queryKey: progressKeys.list(params),
    queryFn: () => progressApi.listMine(params),
    enabled,
    staleTime: 30_000,
    refetchOnMount: 'always',
  });
}

export function useCourseProgress(courseId: string, enabled = true) {
  return useQuery({
    queryKey: progressKeys.course(courseId),
    queryFn: () => progressApi.getCourse(courseId),
    enabled: enabled && Boolean(courseId),
    staleTime: 30_000,
  });
}

export function useResumePoint(courseId: string, enabled = true) {
  return useQuery({
    queryKey: progressKeys.resume(courseId),
    queryFn: () => progressApi.getResume(courseId),
    enabled: enabled && Boolean(courseId),
  });
}

export function useBookmarks(params?: BookmarkListParams, enabled = true) {
  return useQuery({
    queryKey: progressKeys.bookmarks(params),
    queryFn: () => progressApi.listBookmarks(params),
    enabled,
    staleTime: 30_000,
  });
}

export function useNotes(params?: NoteListParams, enabled = true) {
  return useQuery({
    queryKey: progressKeys.notes(params),
    queryFn: () => progressApi.listNotes(params),
    enabled,
    staleTime: 30_000,
  });
}

export function useActivity(params?: ActivityListParams, enabled = true) {
  return useQuery({
    queryKey: progressKeys.activity(params),
    queryFn: () => progressApi.listActivity(params),
    enabled,
    staleTime: 30_000,
  });
}

export function useStudentProgressDashboard(enabled = true) {
  return useQuery({
    queryKey: progressKeys.studentDashboard(),
    queryFn: () => progressApi.studentDashboard(),
    enabled,
    staleTime: 60_000,
  });
}

export function useFacultyProgressDashboard(courseId: string, enabled = true) {
  return useQuery({
    queryKey: progressKeys.facultyDashboard(courseId),
    queryFn: () => progressApi.facultyDashboard(courseId),
    enabled: enabled && Boolean(courseId),
    staleTime: 60_000,
  });
}

export function useInstitutionProgressDashboard(enabled = true) {
  return useQuery({
    queryKey: progressKeys.institutionDashboard(),
    queryFn: () => progressApi.institutionDashboard(),
    enabled,
    staleTime: 60_000,
  });
}

export function useProgressStats(enabled = true) {
  return useQuery({
    queryKey: progressKeys.stats(),
    queryFn: () => progressApi.stats(),
    enabled,
    staleTime: 60_000,
  });
}

export function useOpenLessonMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: OpenLessonBody) => progressApi.openLesson(body),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: progressKeys.course(vars.courseId) });
      void queryClient.invalidateQueries({ queryKey: progressKeys.studentDashboard() });
      void queryClient.invalidateQueries({ queryKey: progressKeys.lists() });
    },
  });
}

export function useCompleteLessonMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CompleteLessonBody) => progressApi.completeLesson(body),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: progressKeys.course(vars.courseId) });
      void queryClient.invalidateQueries({ queryKey: progressKeys.studentDashboard() });
      void queryClient.invalidateQueries({ queryKey: progressKeys.lists() });
    },
  });
}

export function useUpdateLessonProgressMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateLessonProgressBody) => progressApi.updateLesson(body),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: progressKeys.course(vars.courseId) });
      void queryClient.invalidateQueries({ queryKey: progressKeys.resume(vars.courseId) });
    },
  });
}

export function useCreateBookmarkMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateBookmarkBody) => progressApi.createBookmark(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...progressKeys.all, 'bookmarks'] });
      void queryClient.invalidateQueries({ queryKey: progressKeys.studentDashboard() });
    },
  });
}

export function useDeleteBookmarkMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => progressApi.deleteBookmark(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [...progressKeys.all, 'bookmarks'] });
      const previous = queryClient.getQueriesData<BookmarkListResult>({
        queryKey: [...progressKeys.all, 'bookmarks'],
      });
      queryClient.setQueriesData<BookmarkListResult>(
        { queryKey: [...progressKeys.all, 'bookmarks'] },
        (old) =>
          old
            ? {
                ...old,
                items: old.items.filter((item) => item.id !== id),
                meta: { ...old.meta, total: Math.max(0, old.meta.total - 1) },
              }
            : old,
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      context?.previous.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: [...progressKeys.all, 'bookmarks'] });
      void queryClient.invalidateQueries({ queryKey: progressKeys.studentDashboard() });
    },
  });
}

export function useCreateNoteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateNoteBody) => progressApi.createNote(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...progressKeys.all, 'notes'] });
      void queryClient.invalidateQueries({ queryKey: progressKeys.studentDashboard() });
    },
  });
}

export function useUpdateNoteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateNoteBody }) =>
      progressApi.updateNote(id, body),
    onMutate: async ({ id, body }) => {
      await queryClient.cancelQueries({ queryKey: [...progressKeys.all, 'notes'] });
      const previous = queryClient.getQueriesData<NoteListResult>({
        queryKey: [...progressKeys.all, 'notes'],
      });
      queryClient.setQueriesData<NoteListResult>(
        { queryKey: [...progressKeys.all, 'notes'] },
        (old) =>
          old
            ? {
                ...old,
                items: old.items.map((item) =>
                  item.id === id ? { ...item, text: body.text } : item,
                ),
              }
            : old,
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      context?.previous.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: [...progressKeys.all, 'notes'] });
    },
  });
}

export function useDeleteNoteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => progressApi.deleteNote(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [...progressKeys.all, 'notes'] });
      const previous = queryClient.getQueriesData<NoteListResult>({
        queryKey: [...progressKeys.all, 'notes'],
      });
      queryClient.setQueriesData<NoteListResult>(
        { queryKey: [...progressKeys.all, 'notes'] },
        (old) =>
          old
            ? {
                ...old,
                items: old.items.filter((item) => item.id !== id),
                meta: { ...old.meta, total: Math.max(0, old.meta.total - 1) },
              }
            : old,
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      context?.previous.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: [...progressKeys.all, 'notes'] });
      void queryClient.invalidateQueries({ queryKey: progressKeys.studentDashboard() });
    },
  });
}

export function useStartSessionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { courseId: string; lessonId?: string }) => progressApi.startSession(body),
    onSuccess: () => invalidateProgress(queryClient),
  });
}

export function useEndSessionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { sessionId: string; idleSeconds: number; activeSeconds?: number }) =>
      progressApi.endSession(body),
    onSuccess: () => invalidateProgress(queryClient),
  });
}
