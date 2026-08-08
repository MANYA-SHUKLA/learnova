/**
 * Course Builder TanStack Query hooks — with optimistic updates for reorder
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CourseBuilderLessonNode,
  CourseBuilderModuleNode,
  CourseBuilderTree,
} from '@learnova/types';
import { builderApi, type BuilderReorderBody } from '../services/builder-api';
import type {
  LessonCreatePayload,
  LessonUpdatePayload,
  ModuleCreatePayload,
  ModuleUpdatePayload,
  ResourceCreatePayload,
  ResourceUpdatePayload,
} from '../types';

export const builderKeys = {
  all: ['builder'] as const,
  tree: (courseId: string) => [...builderKeys.all, 'tree', courseId] as const,
};

export function useBuilderTree(courseId: string, enabled = true) {
  return useQuery({
    queryKey: builderKeys.tree(courseId),
    queryFn: () => builderApi.getTree(courseId),
    enabled: enabled && Boolean(courseId),
    staleTime: 30_000,
  });
}

function invalidateTree(queryClient: ReturnType<typeof useQueryClient>, courseId: string) {
  void queryClient.invalidateQueries({ queryKey: builderKeys.tree(courseId) });
}

export function useCreateModuleMutation(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ModuleCreatePayload) => builderApi.createModule(courseId, body),
    onSuccess: () => { invalidateTree(queryClient, courseId); },
  });
}

export function useUpdateModuleMutation(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ moduleId, body }: { moduleId: string; body: ModuleUpdatePayload }) =>
      builderApi.updateModule(courseId, moduleId, body),
    onSuccess: () => { invalidateTree(queryClient, courseId); },
  });
}

export function useDeleteModuleMutation(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (moduleId: string) => builderApi.deleteModule(courseId, moduleId),
    onSuccess: () => { invalidateTree(queryClient, courseId); },
  });
}

export function useDuplicateModuleMutation(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (moduleId: string) => builderApi.duplicateModule(courseId, moduleId),
    onSuccess: () => { invalidateTree(queryClient, courseId); },
  });
}

export function useReorderModulesMutation(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (moduleIds: string[]) => {
      const body: BuilderReorderBody = {
        modules: moduleIds.map((id, orderIndex) => ({ id, orderIndex })),
      };
      return builderApi.reorder(courseId, body);
    },
    onMutate: async (moduleIds) => {
      await queryClient.cancelQueries({ queryKey: builderKeys.tree(courseId) });
      const prev = queryClient.getQueryData<CourseBuilderTree>(builderKeys.tree(courseId));
      if (prev) {
        const reordered = moduleIds
          .map((id) => prev.modules.find((m) => m.id === id))
          .filter((m): m is CourseBuilderModuleNode => m !== undefined)
          .map((m, orderIndex) => ({ ...m, orderIndex }));
        queryClient.setQueryData<CourseBuilderTree>(builderKeys.tree(courseId), {
          ...prev,
          modules: reordered,
        });
      }
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(builderKeys.tree(courseId), context.prev);
      }
    },
    onSettled: () => { invalidateTree(queryClient, courseId); },
  });
}

export function useCreateLessonMutation(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: LessonCreatePayload) => builderApi.createLesson(courseId, body),
    onSuccess: () => { invalidateTree(queryClient, courseId); },
  });
}

export function useUpdateLessonMutation(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ lessonId, body }: { lessonId: string; body: LessonUpdatePayload }) =>
      builderApi.updateLesson(courseId, lessonId, body),
    onSuccess: () => { invalidateTree(queryClient, courseId); },
  });
}

export function useDeleteLessonMutation(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (lessonId: string) => builderApi.deleteLesson(courseId, lessonId),
    onSuccess: () => { invalidateTree(queryClient, courseId); },
  });
}

export function useDuplicateLessonMutation(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (lessonId: string) => builderApi.duplicateLesson(courseId, lessonId),
    onSuccess: () => { invalidateTree(queryClient, courseId); },
  });
}

export function useReorderLessonsMutation(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ moduleId, lessonIds }: { moduleId: string; lessonIds: string[] }) => {
      const body: BuilderReorderBody = {
        lessons: lessonIds.map((id, orderIndex) => ({ id, moduleId, orderIndex })),
      };
      return builderApi.reorder(courseId, body);
    },
    onMutate: async ({ moduleId, lessonIds }) => {
      await queryClient.cancelQueries({ queryKey: builderKeys.tree(courseId) });
      const prev = queryClient.getQueryData<CourseBuilderTree>(builderKeys.tree(courseId));
      if (prev) {
        const modules = prev.modules.map((mod) => {
          if (mod.id !== moduleId) return mod;
          const reordered = lessonIds
            .map((id) => mod.lessons.find((l) => l.id === id))
            .filter((l): l is CourseBuilderLessonNode => l !== undefined)
            .map((l, orderIndex) => ({ ...l, orderIndex }));
          return { ...mod, lessons: reordered };
        });
        queryClient.setQueryData<CourseBuilderTree>(builderKeys.tree(courseId), {
          ...prev,
          modules,
        });
      }
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(builderKeys.tree(courseId), context.prev);
      }
    },
    onSettled: () => { invalidateTree(queryClient, courseId); },
  });
}

export function useCreateResourceMutation(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ResourceCreatePayload) => {
      const { lessonId, ...rest } = body;
      return builderApi.createResource(courseId, lessonId, rest);
    },
    onSuccess: () => { invalidateTree(queryClient, courseId); },
  });
}

export function useUpdateResourceMutation(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      lessonId,
      resourceId,
      body,
    }: {
      lessonId: string;
      resourceId: string;
      body: ResourceUpdatePayload;
    }) => builderApi.updateResource(courseId, lessonId, resourceId, body),
    onSuccess: () => { invalidateTree(queryClient, courseId); },
  });
}

export function useDeleteResourceMutation(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ lessonId, resourceId }: { lessonId: string; resourceId: string }) =>
      builderApi.deleteResource(courseId, lessonId, resourceId),
    onSuccess: () => { invalidateTree(queryClient, courseId); },
  });
}
