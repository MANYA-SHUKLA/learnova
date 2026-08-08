/**
 * Institution API wrappers — relative to NEXT_PUBLIC_API_URL (/api/v1).
 */

import { API_ROUTES, PAGINATION } from '@learnova/constants';
import type {
  AcademicCalendar,
  AcademicYear,
  Batch,
  Campus,
  Department,
  Institution,
  InstitutionSettings,
  PaginatedMeta,
  Program,
  School,
  Section,
  Semester,
} from '@learnova/types';
import { apiClient } from '@/lib/api/client';
import type {
  AcademicCalendarInput,
  AcademicYearInput,
  BatchInput,
  CampusInput,
  DepartmentInput,
  InstitutionBrandingInput,
  InstitutionSettingsInput,
  InstitutionUpdateInput,
  OrgListParams,
  OrgListResult,
  ProgramInput,
  SchoolInput,
  SectionInput,
  SemesterInput,
} from '../types';

const emptyMeta = (page?: number, limit?: number): PaginatedMeta => ({
  page: page ?? PAGINATION.DEFAULT_PAGE,
  limit: limit ?? PAGINATION.DEFAULT_LIMIT,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false,
});

function toQuery(params: OrgListParams = {}): string {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  if (params.status) search.set('status', params.status);
  if (params.includeDeleted !== undefined) {
    search.set('includeDeleted', String(params.includeDeleted));
  }
  if (params.schoolId) search.set('schoolId', params.schoolId);
  if (params.departmentId) search.set('departmentId', params.departmentId);
  if (params.programId) search.set('programId', params.programId);
  if (params.academicYearId) search.set('academicYearId', params.academicYearId);
  if (params.semesterId) search.set('semesterId', params.semesterId);
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  if (params.sortBy) search.set('sortBy', params.sortBy);
  if (params.sortOrder) search.set('sortOrder', params.sortOrder);
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

async function listResource<T>(path: string, params?: OrgListParams): Promise<OrgListResult<T>> {
  const { data, meta } = await apiClient.getWithMeta<{ items: T[] }>(
    `${path}${toQuery(params)}`,
  );
  return {
    items: data.items,
    meta: meta ?? emptyMeta(params?.page, params?.limit),
  };
}

function makeCrudApi<T, TCreate>(basePath: string) {
  return {
    list: (params?: OrgListParams) => listResource<T>(basePath, params),
    get: (id: string) => apiClient.get<T>(`${basePath}/${id}`),
    create: (body: TCreate) => apiClient.post<T>(basePath, body),
    update: (id: string, body: Partial<TCreate>) =>
      apiClient.patch<T>(`${basePath}/${id}`, body),
    archive: (id: string) => apiClient.delete<T>(`${basePath}/${id}`),
    restore: (id: string) => apiClient.post<T>(`${basePath}/${id}/restore`),
  };
}

export const institutionApi = {
  getMe: () => apiClient.get<Institution>(`${API_ROUTES.INSTITUTIONS}/me`),

  list: (params?: OrgListParams) =>
    listResource<Institution>(API_ROUTES.INSTITUTIONS, params),

  get: (id: string) => apiClient.get<Institution>(`${API_ROUTES.INSTITUTIONS}/${id}`),

  create: (body: InstitutionUpdateInput & { name: string; shortName: string; slug: string; code: string; email: string; country: string }) =>
    apiClient.post<Institution>(API_ROUTES.INSTITUTIONS, body),

  update: (id: string, body: InstitutionUpdateInput) =>
    apiClient.patch<Institution>(`${API_ROUTES.INSTITUTIONS}/${id}`, body),

  updateBranding: (id: string, body: InstitutionBrandingInput) =>
    apiClient.patch<Institution>(`${API_ROUTES.INSTITUTIONS}/${id}/branding`, body),

  archive: (id: string) =>
    apiClient.delete<Institution>(`${API_ROUTES.INSTITUTIONS}/${id}`),

  restore: (id: string) =>
    apiClient.post<Institution>(`${API_ROUTES.INSTITUTIONS}/${id}/restore`),

  campuses: makeCrudApi<Campus, CampusInput>(API_ROUTES.CAMPUSES),
  schools: makeCrudApi<School, SchoolInput>(API_ROUTES.SCHOOLS),
  departments: makeCrudApi<Department, DepartmentInput>(API_ROUTES.DEPARTMENTS),
  programs: makeCrudApi<Program, ProgramInput>(API_ROUTES.PROGRAMS),
  academicYears: makeCrudApi<AcademicYear, AcademicYearInput>(API_ROUTES.ACADEMIC_YEARS),
  semesters: makeCrudApi<Semester, SemesterInput>(API_ROUTES.SEMESTERS),
  sections: makeCrudApi<Section, SectionInput>(API_ROUTES.SECTIONS),
  batches: makeCrudApi<Batch, BatchInput>(API_ROUTES.BATCHES),
  academicCalendars: makeCrudApi<AcademicCalendar, AcademicCalendarInput>(
    API_ROUTES.ACADEMIC_CALENDARS,
  ),

  getSettings: () => apiClient.get<InstitutionSettings>(API_ROUTES.INSTITUTION_SETTINGS),

  updateSettings: (body: InstitutionSettingsInput) =>
    apiClient.patch<InstitutionSettings>(API_ROUTES.INSTITUTION_SETTINGS, body),
};
