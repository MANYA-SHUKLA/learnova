/**
 * Enrollment API client — relative to NEXT_PUBLIC_API_URL (/api/v1).
 */

import { API_ROUTES, PAGINATION } from '@learnova/constants';
import type {
  Enrollment,
  EnrollmentImportPreview,
  EnrollmentImportResult,
  EnrollmentStats,
  PaginatedMeta,
  EnrollmentWaitlistEntry,
} from '@learnova/types';
import { apiClient } from '@/lib/api/client';
import type {
  EnrollmentBulkApproveBody,
  EnrollmentBulkIdsBody,
  EnrollmentBulkRejectBody,
  EnrollmentCreateBody,
  EnrollmentListParams,
  EnrollmentListResult,
  EnrollmentSelfEnrollBody,
  EnrollmentUpdateBody,
} from '../types';

const emptyMeta = (page?: number, limit?: number): PaginatedMeta => ({
  page: page ?? PAGINATION.DEFAULT_PAGE,
  limit: limit ?? PAGINATION.DEFAULT_LIMIT,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false,
});

function toQuery(params: EnrollmentListParams = {}): string {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  if (params.status) search.set('status', params.status);
  if (params.approvalStatus) search.set('approvalStatus', params.approvalStatus);
  if (params.completionStatus) search.set('completionStatus', params.completionStatus);
  if (params.enrollmentMethod) search.set('enrollmentMethod', params.enrollmentMethod);
  if (params.includeDeleted !== undefined) {
    search.set('includeDeleted', String(params.includeDeleted));
  }
  if (params.studentId) search.set('studentId', params.studentId);
  if (params.courseId) search.set('courseId', params.courseId);
  if (params.facultyId) search.set('facultyId', params.facultyId);
  if (params.departmentId) search.set('departmentId', params.departmentId);
  if (params.programId) search.set('programId', params.programId);
  if (params.academicYearId) search.set('academicYearId', params.academicYearId);
  if (params.semesterId) search.set('semesterId', params.semesterId);
  if (params.sectionId) search.set('sectionId', params.sectionId);
  if (params.enrollmentDateFrom) search.set('enrollmentDateFrom', params.enrollmentDateFrom);
  if (params.enrollmentDateTo) search.set('enrollmentDateTo', params.enrollmentDateTo);
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  if (params.sortBy) search.set('sortBy', params.sortBy);
  if (params.sortOrder) search.set('sortOrder', params.sortOrder);
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const enrollmentApi = {
  list: async (params?: EnrollmentListParams): Promise<EnrollmentListResult> => {
    const { data, meta } = await apiClient.getWithMeta<{ items: Enrollment[] }>(
      `${API_ROUTES.ENROLLMENTS}${toQuery(params)}`,
    );
    return { items: data.items, meta: meta ?? emptyMeta(params?.page, params?.limit) };
  },

  stats: () => apiClient.get<EnrollmentStats>(`${API_ROUTES.ENROLLMENTS}/stats`),

  get: (id: string) => apiClient.get<Enrollment>(`${API_ROUTES.ENROLLMENTS}/${id}`),

  getMyEnrollments: (params?: EnrollmentListParams) =>
    apiClient.getWithMeta<{ items: Enrollment[] }>(
      `${API_ROUTES.ENROLLMENTS}/me${toQuery(params)}`,
    ),

  create: (body: EnrollmentCreateBody) =>
    apiClient.post<Enrollment>(API_ROUTES.ENROLLMENTS, body),

  update: (id: string, body: EnrollmentUpdateBody) =>
    apiClient.patch<Enrollment>(`${API_ROUTES.ENROLLMENTS}/${id}`, body),

  approve: (id: string) =>
    apiClient.post<Enrollment>(`${API_ROUTES.ENROLLMENTS}/${id}/approve`),

  reject: (id: string, reason?: string) =>
    apiClient.post<Enrollment>(`${API_ROUTES.ENROLLMENTS}/${id}/reject`, { reason }),

  withdraw: (id: string, reason?: string) =>
    apiClient.post<Enrollment>(`${API_ROUTES.ENROLLMENTS}/${id}/withdraw`, { reason }),

  complete: (id: string) =>
    apiClient.post<Enrollment>(`${API_ROUTES.ENROLLMENTS}/${id}/complete`),

  archive: (id: string) => apiClient.delete<Enrollment>(`${API_ROUTES.ENROLLMENTS}/${id}`),

  restore: (id: string) =>
    apiClient.post<Enrollment>(`${API_ROUTES.ENROLLMENTS}/${id}/restore`),

  bulkApprove: (body: EnrollmentBulkApproveBody) =>
    apiClient.post<{ modified: number }>(`${API_ROUTES.ENROLLMENTS}/bulk/approve`, body),

  bulkReject: (body: EnrollmentBulkRejectBody) =>
    apiClient.post<{ modified: number }>(`${API_ROUTES.ENROLLMENTS}/bulk/reject`, body),

  bulkArchive: (body: EnrollmentBulkIdsBody) =>
    apiClient.post<{ modified: number }>(`${API_ROUTES.ENROLLMENTS}/bulk/archive`, body),

  selfEnroll: (body: EnrollmentSelfEnrollBody) =>
    apiClient.post<Enrollment>(`${API_ROUTES.ENROLLMENTS}/self-enroll`, body),

  waitlist: () =>
    apiClient.get<{ items: EnrollmentWaitlistEntry[] }>(
      `${API_ROUTES.ENROLLMENTS}/waitlist`,
    ),

  leaveWaitlist: (courseId: string) =>
    apiClient.post(`${API_ROUTES.ENROLLMENTS}/waitlist/${courseId}/leave`),

  previewImport: (rows: Record<string, string>[]) =>
    apiClient.post<EnrollmentImportPreview>(`${API_ROUTES.ENROLLMENTS}/import/preview`, {
      rows,
      dryRun: true,
    }),

  import: (rows: Record<string, string>[], dryRun = false) =>
    apiClient.post<EnrollmentImportResult & EnrollmentImportPreview>(
      `${API_ROUTES.ENROLLMENTS}/import`,
      {
        rows,
        dryRun,
      },
    ),
};
