/**
 * Faculty API client — relative to NEXT_PUBLIC_API_URL (/api/v1).
 */

import { API_ROUTES, PAGINATION } from '@learnova/constants';
import type {
  Faculty,
  FacultyImportPreview,
  FacultyImportResult,
  FacultyStats,
  PaginatedMeta,
} from '@learnova/types';
import { apiClient } from '@/lib/api/client';
import type {
  FacultyBulkAssignDepartmentBody,
  FacultyBulkAssignProgramBody,
  FacultyBulkIdsBody,
  FacultyBulkStatusBody,
  FacultyCreateBody,
  FacultyListParams,
  FacultyListResult,
  FacultyPhotoUploadBody,
  FacultyUpdateBody,
  FacultyUpdateProfileBody,
} from '../types';

const emptyMeta = (page?: number, limit?: number): PaginatedMeta => ({
  page: page ?? PAGINATION.DEFAULT_PAGE,
  limit: limit ?? PAGINATION.DEFAULT_LIMIT,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false,
});

function toQuery(params: FacultyListParams = {}): string {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  if (params.status) search.set('status', params.status);
  if (params.includeDeleted !== undefined) {
    search.set('includeDeleted', String(params.includeDeleted));
  }
  if (params.campusId) search.set('campusId', params.campusId);
  if (params.schoolId) search.set('schoolId', params.schoolId);
  if (params.departmentId) search.set('departmentId', params.departmentId);
  if (params.programId) search.set('programId', params.programId);
  if (params.designation) search.set('designation', params.designation);
  if (params.employmentType) search.set('employmentType', params.employmentType);
  if (params.joiningDateFrom) search.set('joiningDateFrom', params.joiningDateFrom);
  if (params.joiningDateTo) search.set('joiningDateTo', params.joiningDateTo);
  if (params.experienceMin !== undefined) {
    search.set('experienceMin', String(params.experienceMin));
  }
  if (params.experienceMax !== undefined) {
    search.set('experienceMax', String(params.experienceMax));
  }
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  if (params.sortBy) search.set('sortBy', params.sortBy);
  if (params.sortOrder) search.set('sortOrder', params.sortOrder);
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const facultyApi = {
  list: async (params?: FacultyListParams): Promise<FacultyListResult> => {
    const { data, meta } = await apiClient.getWithMeta<{ items: Faculty[] }>(
      `${API_ROUTES.FACULTY}${toQuery(params)}`,
    );
    return { items: data.items, meta: meta ?? emptyMeta(params?.page, params?.limit) };
  },

  stats: () => apiClient.get<FacultyStats>(`${API_ROUTES.FACULTY}/stats`),

  get: (id: string) => apiClient.get<Faculty>(`${API_ROUTES.FACULTY}/${id}`),

  getMe: () => apiClient.get<Faculty>(`${API_ROUTES.FACULTY}/me`),

  create: (body: FacultyCreateBody) =>
    apiClient.post<import('../types').FacultyCreateResult>(API_ROUTES.FACULTY, body),

  update: (id: string, body: FacultyUpdateBody) =>
    apiClient.patch<Faculty>(`${API_ROUTES.FACULTY}/${id}`, body),

  updateMe: (body: FacultyUpdateProfileBody) =>
    apiClient.patch<Faculty>(`${API_ROUTES.FACULTY}/me`, body),

  archive: (id: string) => apiClient.delete<Faculty>(`${API_ROUTES.FACULTY}/${id}`),

  restore: (id: string) => apiClient.post<Faculty>(`${API_ROUTES.FACULTY}/${id}/restore`),

  activate: (id: string) => apiClient.post<Faculty>(`${API_ROUTES.FACULTY}/${id}/activate`),

  deactivate: (id: string) => apiClient.post<Faculty>(`${API_ROUTES.FACULTY}/${id}/deactivate`),

  audit: (facultyId?: string) =>
    apiClient.get<{ items: Array<Record<string, unknown>> }>(
      `${API_ROUTES.FACULTY}/audit${facultyId ? `?facultyId=${facultyId}` : ''}`,
    ),

  bulkArchive: (body: FacultyBulkIdsBody) =>
    apiClient.post<{ modified: number }>(`${API_ROUTES.FACULTY}/bulk/archive`, body),

  bulkActivate: (body: FacultyBulkIdsBody) =>
    apiClient.post<{ modified: number }>(`${API_ROUTES.FACULTY}/bulk/activate`, body),

  bulkSuspend: (body: FacultyBulkIdsBody) =>
    apiClient.post<{ modified: number }>(`${API_ROUTES.FACULTY}/bulk/suspend`, body),

  bulkStatus: (body: FacultyBulkStatusBody) =>
    apiClient.post<{ modified: number }>(`${API_ROUTES.FACULTY}/bulk/status`, body),

  bulkAssignDepartment: (body: FacultyBulkAssignDepartmentBody) =>
    apiClient.post<{ modified: number }>(`${API_ROUTES.FACULTY}/bulk/assign-department`, body),

  bulkAssignProgram: (body: FacultyBulkAssignProgramBody) =>
    apiClient.post<{ modified: number }>(`${API_ROUTES.FACULTY}/bulk/assign-program`, body),

  previewImport: (rows: Array<Record<string, string>>) =>
    apiClient.post<FacultyImportPreview>(`${API_ROUTES.FACULTY}/import/preview`, {
      rows,
      dryRun: true,
    }),

  import: (rows: Array<Record<string, string>>, dryRun = false) =>
    apiClient.post<FacultyImportResult & FacultyImportPreview>(`${API_ROUTES.FACULTY}/import`, {
      rows,
      dryRun,
    }),

  uploadPhoto: (id: string, body: FacultyPhotoUploadBody) =>
    apiClient.post<Faculty>(`${API_ROUTES.FACULTY}/${id}/photo`, body),

  removePhoto: (id: string) => apiClient.delete<Faculty>(`${API_ROUTES.FACULTY}/${id}/photo`),
};
