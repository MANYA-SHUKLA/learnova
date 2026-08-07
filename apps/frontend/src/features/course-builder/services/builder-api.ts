/**
 * Course Builder API client — endpoints under /courses/:courseId/...
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
  ReorderLessonsPayload,
  ReorderModulesPayload,
  ResourceCreatePayload,
  ResourceUpdatePayload,
} from '../types';

export const builderApi = {
  // Tree
  getTree: (courseId: string) =>
    apiClient.get<CourseBuilderTree>(`${API_ROUTES.COURSES}/${courseId}/builder/tree`),

  // Modules
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

  reorderModules: (courseId: string, body: ReorderModulesPayload) =>
    apiClient.post<{ modified: number }>(
      `${API_ROUTES.COURSES}/${courseId}/modules/reorder`,
      body,
    ),

  // Lessons
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

  reorderLessons: (courseId: string, moduleId: string, body: ReorderLessonsPayload) =>
    apiClient.post<{ modified: number }>(
      `${API_ROUTES.COURSES}/${courseId}/modules/${moduleId}/lessons/reorder`,
      body,
    ),

  // Resources
  createResource: (courseId: string, body: ResourceCreatePayload) =>
    apiClient.post<CourseResource>(`${API_ROUTES.COURSES}/${courseId}/resources`, body),

  updateResource: (courseId: string, resourceId: string, body: ResourceUpdatePayload) =>
    apiClient.patch<CourseResource>(
      `${API_ROUTES.COURSES}/${courseId}/resources/${resourceId}`,
      body,
    ),

  deleteResource: (courseId: string, resourceId: string) =>
    apiClient.delete<CourseResource>(`${API_ROUTES.COURSES}/${courseId}/resources/${resourceId}`),
};
