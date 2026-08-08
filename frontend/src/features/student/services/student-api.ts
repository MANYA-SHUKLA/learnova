/**
 * Student API client — relative to NEXT_PUBLIC_API_URL (/api/v1).
 */

import { API_ROUTES, PAGINATION } from '@learnova/constants';
import type {
  Student,
  StudentImportPreview,
  StudentImportResult,
  StudentStats,
  PaginatedMeta,
} from '@learnova/types';
import { apiClient } from '@/lib/api/client';
import type {
  StudentBulkAssignDepartmentBody,
  StudentBulkAssignProgramBody,
  StudentBulkAssignSectionBody,
  StudentBulkIdsBody,
  StudentBulkStatusBody,
  StudentCreateBody,
  StudentListParams,
  StudentListResult,
  StudentPhotoUploadBody,
  StudentUpdateBody,
  StudentUpdateProfileBody,
} from '../types';

const emptyMeta = (page?: number, limit?: number): PaginatedMeta => ({
  page: page ?? PAGINATION.DEFAULT_PAGE,
  limit: limit ?? PAGINATION.DEFAULT_LIMIT,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false,
});

function toQuery(params: StudentListParams = {}): string {
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
  if (params.academicYearId) search.set('academicYearId', params.academicYearId);
  if (params.semesterId) search.set('semesterId', params.semesterId);
  if (params.sectionId) search.set('sectionId', params.sectionId);
  if (params.batchId) search.set('batchId', params.batchId);
  if (params.gender) search.set('gender', params.gender);
  if (params.scholarship !== undefined) {
    search.set('scholarship', String(params.scholarship));
  }
  if (params.hostelResident !== undefined) {
    search.set('hostelResident', String(params.hostelResident));
  }
  if (params.transportRequired !== undefined) {
    search.set('transportRequired', String(params.transportRequired));
  }
  if (params.admissionDateFrom) search.set('admissionDateFrom', params.admissionDateFrom);
  if (params.admissionDateTo) search.set('admissionDateTo', params.admissionDateTo);
  if (params.yearOfStudy !== undefined) {
    search.set('yearOfStudy', String(params.yearOfStudy));
  }
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  if (params.sortBy) search.set('sortBy', params.sortBy);
  if (params.sortOrder) search.set('sortOrder', params.sortOrder);
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const studentApi = {
  list: async (params?: StudentListParams): Promise<StudentListResult> => {
    const { data, meta } = await apiClient.getWithMeta<{ items: Student[] }>(
      `${API_ROUTES.STUDENTS}${toQuery(params)}`,
    );
    return { items: data.items, meta: meta ?? emptyMeta(params?.page, params?.limit) };
  },

  stats: () => apiClient.get<StudentStats>(`${API_ROUTES.STUDENTS}/stats`),

  get: (id: string) => apiClient.get<Student>(`${API_ROUTES.STUDENTS}/${id}`),

  getMe: () => apiClient.get<Student>(`${API_ROUTES.STUDENTS}/me`),

  create: (body: StudentCreateBody) =>
    apiClient.post<import('../types').StudentCreateResult>(API_ROUTES.STUDENTS, body),

  update: (id: string, body: StudentUpdateBody) =>
    apiClient.patch<Student>(`${API_ROUTES.STUDENTS}/${id}`, body),

  updateMe: (body: StudentUpdateProfileBody) =>
    apiClient.patch<Student>(`${API_ROUTES.STUDENTS}/me`, body),

  archive: (id: string) => apiClient.delete<Student>(`${API_ROUTES.STUDENTS}/${id}`),

  restore: (id: string) => apiClient.post<Student>(`${API_ROUTES.STUDENTS}/${id}/restore`),

  activate: (id: string) => apiClient.post<Student>(`${API_ROUTES.STUDENTS}/${id}/activate`),

  deactivate: (id: string) => apiClient.post<Student>(`${API_ROUTES.STUDENTS}/${id}/deactivate`),

  audit: (studentId?: string) =>
    apiClient.get<{ items: Record<string, unknown>[] }>(
      `${API_ROUTES.STUDENTS}/audit${studentId ? `?studentId=${studentId}` : ''}`,
    ),

  bulkArchive: (body: StudentBulkIdsBody) =>
    apiClient.post<{ modified: number }>(`${API_ROUTES.STUDENTS}/bulk/archive`, body),

  bulkActivate: (body: StudentBulkIdsBody) =>
    apiClient.post<{ modified: number }>(`${API_ROUTES.STUDENTS}/bulk/activate`, body),

  bulkSuspend: (body: StudentBulkIdsBody) =>
    apiClient.post<{ modified: number }>(`${API_ROUTES.STUDENTS}/bulk/suspend`, body),

  bulkStatus: (body: StudentBulkStatusBody) =>
    apiClient.post<{ modified: number }>(`${API_ROUTES.STUDENTS}/bulk/status`, body),

  bulkAssignDepartment: (body: StudentBulkAssignDepartmentBody) =>
    apiClient.post<{ modified: number }>(`${API_ROUTES.STUDENTS}/bulk/assign-department`, body),

  bulkAssignProgram: (body: StudentBulkAssignProgramBody) =>
    apiClient.post<{ modified: number }>(`${API_ROUTES.STUDENTS}/bulk/assign-program`, body),

  bulkAssignSection: (body: StudentBulkAssignSectionBody) =>
    apiClient.post<{ modified: number }>(`${API_ROUTES.STUDENTS}/bulk/assign-section`, body),

  previewImport: (rows: Record<string, string>[]) =>
    apiClient.post<StudentImportPreview>(`${API_ROUTES.STUDENTS}/import/preview`, {
      rows,
      dryRun: true,
    }),

  import: (rows: Record<string, string>[], dryRun = false) =>
    apiClient.post<StudentImportResult & StudentImportPreview>(`${API_ROUTES.STUDENTS}/import`, {
      rows,
      dryRun,
    }),

  uploadPhoto: (id: string, body: StudentPhotoUploadBody) =>
    apiClient.post<Student>(`${API_ROUTES.STUDENTS}/${id}/photo`, body),

  removePhoto: (id: string) => apiClient.delete<Student>(`${API_ROUTES.STUDENTS}/${id}/photo`),
};
