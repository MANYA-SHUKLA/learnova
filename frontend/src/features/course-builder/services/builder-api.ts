/**
 * Course Builder API client — endpoints under /courses/:courseId/...
 * Aligned with apps/backend/src/routes/v1/course-builder.routes.ts
 */

import { API_ROUTES } from '@learnova/constants';
import type {
  CourseBuilderTree,
  CourseLesson,
  CourseModule,
  CourseResource,
} from '@learnova/types';
import { apiClient } from '@/lib/api/client';
import type {
  LessonCreatePayload,
  LessonUpdatePayload,
  ModuleCreatePayload,
  ModuleUpdatePayload,
  ResourceCreatePayload,
  ResourceUpdatePayload,
} from '../types';

export interface BuilderReorderBody {
  modules?: Array<{ id: string; orderIndex: number }>;
  lessons?: Array<{ id: string; moduleId: string; orderIndex: number }>;
  resources?: Array<{ id: string; lessonId: string; orderIndex: number }>;
}

export const builderApi = {
  getTree: (courseId: string) =>
    apiClient.get<CourseBuilderTree>(`${API_ROUTES.COURSES}/${courseId}/builder`),

  search: (courseId: string, params?: Record<string, string | boolean | undefined>) => {
    const search = new URLSearchParams();
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== '') search.set(key, String(value));
      }
    }
    const qs = search.toString();
    return apiClient.get<{
      modules: CourseModule[];
      lessons: CourseLesson[];
      resources: CourseResource[];
    }>(`${API_ROUTES.COURSES}/${courseId}/builder/search${qs ? `?${qs}` : ''}`);
  },

  reorder: (courseId: string, body: BuilderReorderBody) =>
    apiClient.post<{ ok: boolean }>(`${API_ROUTES.COURSES}/${courseId}/builder/reorder`, body),

  createModule: (courseId: string, body: ModuleCreatePayload) =>
    apiClient.post<CourseModule>(`${API_ROUTES.COURSES}/${courseId}/modules`, body),

  updateModule: (courseId: string, moduleId: string, body: ModuleUpdatePayload) =>
    apiClient.patch<CourseModule>(`${API_ROUTES.COURSES}/${courseId}/modules/${moduleId}`, body),

  deleteModule: (courseId: string, moduleId: string) =>
    apiClient.delete<CourseModule>(`${API_ROUTES.COURSES}/${courseId}/modules/${moduleId}`),

  duplicateModule: (courseId: string, moduleId: string) =>
    apiClient.post<CourseModule>(
      `${API_ROUTES.COURSES}/${courseId}/modules/${moduleId}/duplicate`,
    ),

  createLesson: (courseId: string, body: LessonCreatePayload) =>
    apiClient.post<CourseLesson>(`${API_ROUTES.COURSES}/${courseId}/lessons`, body),

  updateLesson: (courseId: string, lessonId: string, body: LessonUpdatePayload) =>
    apiClient.patch<CourseLesson>(`${API_ROUTES.COURSES}/${courseId}/lessons/${lessonId}`, body),

  deleteLesson: (courseId: string, lessonId: string) =>
    apiClient.delete<CourseLesson>(`${API_ROUTES.COURSES}/${courseId}/lessons/${lessonId}`),

  duplicateLesson: (courseId: string, lessonId: string) =>
    apiClient.post<CourseLesson>(
      `${API_ROUTES.COURSES}/${courseId}/lessons/${lessonId}/duplicate`,
    ),

  moveLesson: (courseId: string, lessonId: string, body: { moduleId: string; orderIndex?: number }) =>
    apiClient.post<CourseLesson>(
      `${API_ROUTES.COURSES}/${courseId}/lessons/${lessonId}/move`,
      body,
    ),

  createResource: (courseId: string, lessonId: string, body: Omit<ResourceCreatePayload, 'lessonId'>) =>
    apiClient.post<CourseResource>(
      `${API_ROUTES.COURSES}/${courseId}/lessons/${lessonId}/resources`,
      body,
    ),

  updateResource: (
    courseId: string,
    lessonId: string,
    resourceId: string,
    body: ResourceUpdatePayload,
  ) =>
    apiClient.patch<CourseResource>(
      `${API_ROUTES.COURSES}/${courseId}/lessons/${lessonId}/resources/${resourceId}`,
      body,
    ),

  deleteResource: (courseId: string, lessonId: string, resourceId: string) =>
    apiClient.delete<CourseResource>(
      `${API_ROUTES.COURSES}/${courseId}/lessons/${lessonId}/resources/${resourceId}`,
    ),
};
