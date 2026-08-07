/**
 * Course API client — relative to NEXT_PUBLIC_API_URL (/api/v1).
 */

import { API_ROUTES } from '@learnova/constants';
import type { Course, CourseStats } from '@learnova/types';
import { apiClient } from '@/lib/api/client';

export const courseApi = {
  list: (params?: Record<string, unknown>) => {
    const search = new URLSearchParams(params as Record<string, string>);
    const qs = search.toString();
    return apiClient.get<{ items: Course[] }>(`${API_ROUTES.COURSES}${qs ? `?${qs}` : ''}`);
  },

  stats: () => apiClient.get<CourseStats>(`${API_ROUTES.COURSES}/stats`),

  get: (id: string) => apiClient.get<Course>(`${API_ROUTES.COURSES}/${id}`),

  create: (body: Record<string, unknown>) => apiClient.post<Course>(API_ROUTES.COURSES, body),

  update: (id: string, body: Record<string, unknown>) =>
    apiClient.patch<Course>(`${API_ROUTES.COURSES}/${id}`, body),

  delete: (id: string) => apiClient.delete<Course>(`${API_ROUTES.COURSES}/${id}`),

  publish: (id: string) => apiClient.post<Course>(`${API_ROUTES.COURSES}/${id}/publish`),

  archive: (id: string) => apiClient.post<Course>(`${API_ROUTES.COURSES}/${id}/archive`),
};
