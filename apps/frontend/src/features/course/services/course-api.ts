/**
 * Course API client — relative to NEXT_PUBLIC_API_URL (/api/v1).
 */

import { API_ROUTES, PAGINATION } from '@learnova/constants';
import type {
  Course,
  CourseImportPreview,
  CourseImportResult,
  CourseStats,
  PaginatedMeta,
} from '@learnova/types';
import { apiClient } from '@/lib/api/client';
import type {
  CourseBulkAssignFacultyBody,
  CourseBulkAssignProgramBody,
  CourseBulkIdsBody,
  CourseBulkStatusBody,
  CourseBulkVisibilityBody,
  CourseCreateBody,
  CourseListParams,
  CourseListResult,
  CourseThumbnailUploadBody,
  CourseUpdateBody,
} from '../types';

const emptyMeta = (page?: number, limit?: number): PaginatedMeta => ({
  page: page ?? PAGINATION.DEFAULT_PAGE,
  limit: limit ?? PAGINATION.DEFAULT_LIMIT,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false,
});

function toQuery(params: CourseListParams = {}): string {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  if (params.status) search.set('status', params.status);
  if (params.visibility) search.set('visibility', params.visibility);
  if (params.category) search.set('category', params.category);
  if (params.difficulty) search.set('difficulty', params.difficulty);
  if (params.includeDeleted !== undefined) {
    search.set('includeDeleted', String(params.includeDeleted));
  }
  if (params.campusId) search.set('campusId', params.campusId);
  if (params.schoolId) search.set('schoolId', params.schoolId);
  if (params.departmentId) search.set('departmentId', params.departmentId);
  if (params.programId) search.set('programId', params.programId);
  if (params.semesterId) search.set('semesterId', params.semesterId);
  if (params.facultyId) search.set('facultyId', params.facultyId);
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  if (params.sortBy) search.set('sortBy', params.sortBy);
  if (params.sortOrder) search.set('sortOrder', params.sortOrder);
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const courseApi = {
  list: async (params?: CourseListParams): Promise<CourseListResult> => {
    const { data, meta } = await apiClient.getWithMeta<{ items: Course[] }>(
      `${API_ROUTES.COURSES}${toQuery(params)}`,
    );
    return { items: data.items, meta: meta ?? emptyMeta(params?.page, params?.limit) };
  },

  stats: () => apiClient.get<CourseStats>(`${API_ROUTES.COURSES}/stats`),

  get: (id: string) => apiClient.get<Course>(`${API_ROUTES.COURSES}/${id}`),

  create: (body: CourseCreateBody) => apiClient.post<Course>(API_ROUTES.COURSES, body),

  update: (id: string, body: CourseUpdateBody) =>
    apiClient.patch<Course>(`${API_ROUTES.COURSES}/${id}`, body),

  archive: (id: string) => apiClient.delete<Course>(`${API_ROUTES.COURSES}/${id}`),

  restore: (id: string) => apiClient.post<Course>(`${API_ROUTES.COURSES}/${id}/restore`),

  publish: (id: string) => apiClient.post<Course>(`${API_ROUTES.COURSES}/${id}/publish`),

  unpublish: (id: string) => apiClient.post<Course>(`${API_ROUTES.COURSES}/${id}/unpublish`),

  duplicate: (id: string) => apiClient.post<Course>(`${API_ROUTES.COURSES}/${id}/duplicate`),

  audit: (courseId?: string) =>
    apiClient.get<{ items: Array<Record<string, unknown>> }>(
      `${API_ROUTES.COURSES}/audit${courseId ? `?courseId=${courseId}` : ''}`,
    ),

  bulkArchive: (body: CourseBulkIdsBody) =>
    apiClient.post<{ modified: number }>(`${API_ROUTES.COURSES}/bulk/archive`, body),

  bulkPublish: (body: CourseBulkIdsBody) =>
    apiClient.post<{ modified: number }>(`${API_ROUTES.COURSES}/bulk/publish`, body),

  bulkUnpublish: (body: CourseBulkIdsBody) =>
    apiClient.post<{ modified: number }>(`${API_ROUTES.COURSES}/bulk/unpublish`, body),

  bulkStatus: (body: CourseBulkStatusBody) =>
    apiClient.post<{ modified: number }>(`${API_ROUTES.COURSES}/bulk/status`, body),

  bulkVisibility: (body: CourseBulkVisibilityBody) =>
    apiClient.post<{ modified: number }>(`${API_ROUTES.COURSES}/bulk/visibility`, body),

  bulkAssignFaculty: (body: CourseBulkAssignFacultyBody) =>
    apiClient.post<{ modified: number }>(`${API_ROUTES.COURSES}/bulk/assign-faculty`, body),

  bulkAssignProgram: (body: CourseBulkAssignProgramBody) =>
    apiClient.post<{ modified: number }>(`${API_ROUTES.COURSES}/bulk/assign-program`, body),

  previewImport: (rows: Array<Record<string, string>>) =>
    apiClient.post<CourseImportPreview>(`${API_ROUTES.COURSES}/import/preview`, {
      rows,
      dryRun: true,
    }),

  import: (rows: Array<Record<string, string>>, dryRun = false) =>
    apiClient.post<CourseImportResult & CourseImportPreview>(`${API_ROUTES.COURSES}/import`, {
      rows,
      dryRun,
    }),

  uploadThumbnail: (id: string, body: CourseThumbnailUploadBody) =>
    apiClient.post<Course>(`${API_ROUTES.COURSES}/${id}/thumbnail`, body),

  removeThumbnail: (id: string) => apiClient.delete<Course>(`${API_ROUTES.COURSES}/${id}/thumbnail`),
};
