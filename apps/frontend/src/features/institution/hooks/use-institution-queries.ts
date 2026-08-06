'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AcademicCalendar,
  AcademicYear,
  Batch,
  Campus,
  Department,
  Institution,
  Program,
  School,
  Section,
  Semester,
} from '@learnova/types';
import { ApiClientError } from '@/lib/api/client';
import { institutionApi } from '../services/institution-api';
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

export const institutionKeys = {
  all: ['institution'] as const,
  me: ['institution', 'me'] as const,
  settings: ['institution', 'settings'] as const,
  list: (params?: OrgListParams) => ['institution', 'list', params] as const,
  detail: (id: string) => ['institution', 'detail', id] as const,
  resource: (key: string, params?: OrgListParams) =>
    ['institution', 'resource', key, params] as const,
  resourceDetail: (key: string, id: string) =>
    ['institution', 'resource', key, 'detail', id] as const,
};

function patchListItem<T extends { id: string }>(
  previous: OrgListResult<T> | undefined,
  id: string,
  updater: (item: T) => T,
): OrgListResult<T> | undefined {
  if (!previous) return previous;
  return {
    ...previous,
    items: previous.items.map((item) => (item.id === id ? updater(item) : item)),
  };
}

export function useMyInstitution(enabled = true) {
  return useQuery({
    queryKey: institutionKeys.me,
    queryFn: () => institutionApi.getMe(),
    enabled,
    staleTime: 60_000,
    retry: (count, error) => {
      if (error instanceof ApiClientError && error.status === 404) return false;
      return count < 2;
    },
  });
}

export function useCreateInstitutionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      body: InstitutionUpdateInput & {
        name: string;
        shortName: string;
        slug: string;
        code: string;
        email: string;
        country: string;
      },
    ) => institutionApi.create(body),
    onSuccess: (data) => {
      queryClient.setQueryData(institutionKeys.me, data);
      queryClient.setQueryData(institutionKeys.detail(data.id), data);
      void queryClient.invalidateQueries({ queryKey: institutionKeys.all });
    },
  });
}

export function useInstitution(id: string, enabled = true) {
  return useQuery({
    queryKey: institutionKeys.detail(id),
    queryFn: () => institutionApi.get(id),
    enabled: enabled && Boolean(id),
  });
}

export function useInstitutions(params?: OrgListParams, enabled = true) {
  return useQuery({
    queryKey: institutionKeys.list(params),
    queryFn: () => institutionApi.list(params),
    enabled,
  });
}

export function useUpdateInstitutionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: InstitutionUpdateInput }) =>
      institutionApi.update(id, body),
    onSuccess: (data) => {
      queryClient.setQueryData(institutionKeys.me, data);
      queryClient.setQueryData(institutionKeys.detail(data.id), data);
      void queryClient.invalidateQueries({ queryKey: institutionKeys.all });
    },
  });
}

export function useUpdateBrandingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: InstitutionBrandingInput }) =>
      institutionApi.updateBranding(id, body),
    onMutate: async ({ id, body }) => {
      await queryClient.cancelQueries({ queryKey: institutionKeys.me });
      const previous = queryClient.getQueryData<Institution>(institutionKeys.me);
      if (previous?.id === id) {
        queryClient.setQueryData<Institution>(institutionKeys.me, {
          ...previous,
          ...body,
        });
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(institutionKeys.me, ctx.previous);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(institutionKeys.me, data);
      queryClient.setQueryData(institutionKeys.detail(data.id), data);
    },
  });
}

export function useInstitutionSettings(enabled = true) {
  return useQuery({
    queryKey: institutionKeys.settings,
    queryFn: () => institutionApi.getSettings(),
    enabled,
  });
}

export function useUpdateInstitutionSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: InstitutionSettingsInput) => institutionApi.updateSettings(body),
    onSuccess: (data) => {
      queryClient.setQueryData(institutionKeys.settings, data);
    },
  });
}

interface SoftDeletable { id: string; status: string; deletedAt: string | null }

function makeResourceHooks<T extends SoftDeletable, TCreate, TUpdate = Partial<TCreate>>(
  key: string,
  api: {
    list: (params?: OrgListParams) => Promise<OrgListResult<T>>;
    get: (id: string) => Promise<T>;
    create: (body: TCreate) => Promise<T>;
    update: (id: string, body: TUpdate) => Promise<T>;
    archive: (id: string) => Promise<T>;
    restore: (id: string) => Promise<T>;
  },
) {
  function useList(params?: OrgListParams, enabled = true) {
    return useQuery({
      queryKey: institutionKeys.resource(key, params),
      queryFn: () => api.list(params),
      enabled,
    });
  }

  function useDetail(id: string, enabled = true) {
    return useQuery({
      queryKey: institutionKeys.resourceDetail(key, id),
      queryFn: () => api.get(id),
      enabled: enabled && Boolean(id),
    });
  }

  function useCreate() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (body: TCreate) => api.create(body),
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: ['institution', 'resource', key],
        });
      },
    });
  }

  function useUpdate() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, body }: { id: string; body: TUpdate }) => api.update(id, body),
      onSuccess: (data) => {
        queryClient.setQueryData(institutionKeys.resourceDetail(key, data.id), data);
        void queryClient.invalidateQueries({
          queryKey: ['institution', 'resource', key],
        });
      },
    });
  }

  function useArchive() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => api.archive(id),
      onMutate: async (id) => {
        await queryClient.cancelQueries({ queryKey: ['institution', 'resource', key] });
        const snapshots = queryClient.getQueriesData<OrgListResult<T>>({
          queryKey: ['institution', 'resource', key],
        });
        snapshots.forEach(([queryKey, data]) => {
          queryClient.setQueryData(
            queryKey,
            patchListItem(data, id, (item) => ({
              ...item,
              status: 'archived',
              deletedAt: new Date().toISOString(),
            })),
          );
        });
        return { snapshots };
      },
      onError: (_err, _id, ctx) => {
        ctx?.snapshots.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      },
      onSettled: () => {
        void queryClient.invalidateQueries({
          queryKey: ['institution', 'resource', key],
        });
      },
    });
  }

  function useRestore() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => api.restore(id),
      onMutate: async (id) => {
        await queryClient.cancelQueries({ queryKey: ['institution', 'resource', key] });
        const snapshots = queryClient.getQueriesData<OrgListResult<T>>({
          queryKey: ['institution', 'resource', key],
        });
        snapshots.forEach(([queryKey, data]) => {
          queryClient.setQueryData(
            queryKey,
            patchListItem(data, id, (item) => ({
              ...item,
              status: 'active',
              deletedAt: null,
            })),
          );
        });
        return { snapshots };
      },
      onError: (_err, _id, ctx) => {
        ctx?.snapshots.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      },
      onSettled: () => {
        void queryClient.invalidateQueries({
          queryKey: ['institution', 'resource', key],
        });
      },
    });
  }

  return { useList, useDetail, useCreate, useUpdate, useArchive, useRestore };
}

const campuses = makeResourceHooks<Campus, CampusInput>('campuses', institutionApi.campuses);
const schools = makeResourceHooks<School, SchoolInput>('schools', institutionApi.schools);
const departments = makeResourceHooks<Department, DepartmentInput>(
  'departments',
  institutionApi.departments,
);
const programs = makeResourceHooks<Program, ProgramInput>('programs', institutionApi.programs);
const academicYears = makeResourceHooks<AcademicYear, AcademicYearInput>(
  'academic-years',
  institutionApi.academicYears,
);
const semesters = makeResourceHooks<Semester, SemesterInput>(
  'semesters',
  institutionApi.semesters,
);
const sections = makeResourceHooks<Section, SectionInput>('sections', institutionApi.sections);
const batches = makeResourceHooks<Batch, BatchInput>('batches', institutionApi.batches);
const academicCalendars = makeResourceHooks<AcademicCalendar, AcademicCalendarInput>(
  'academic-calendars',
  institutionApi.academicCalendars,
);

export const useCampuses = campuses.useList;
export const useCampus = campuses.useDetail;
export const useCreateCampusMutation = campuses.useCreate;
export const useUpdateCampusMutation = campuses.useUpdate;
export const useArchiveCampusMutation = campuses.useArchive;
export const useRestoreCampusMutation = campuses.useRestore;

export const useSchools = schools.useList;
export const useSchool = schools.useDetail;
export const useCreateSchoolMutation = schools.useCreate;
export const useUpdateSchoolMutation = schools.useUpdate;
export const useArchiveSchoolMutation = schools.useArchive;
export const useRestoreSchoolMutation = schools.useRestore;

export const useDepartments = departments.useList;
export const useDepartment = departments.useDetail;
export const useCreateDepartmentMutation = departments.useCreate;
export const useUpdateDepartmentMutation = departments.useUpdate;
export const useArchiveDepartmentMutation = departments.useArchive;
export const useRestoreDepartmentMutation = departments.useRestore;

export const usePrograms = programs.useList;
export const useProgram = programs.useDetail;
export const useCreateProgramMutation = programs.useCreate;
export const useUpdateProgramMutation = programs.useUpdate;
export const useArchiveProgramMutation = programs.useArchive;
export const useRestoreProgramMutation = programs.useRestore;

export const useAcademicYears = academicYears.useList;
export const useAcademicYear = academicYears.useDetail;
export const useCreateAcademicYearMutation = academicYears.useCreate;
export const useUpdateAcademicYearMutation = academicYears.useUpdate;
export const useArchiveAcademicYearMutation = academicYears.useArchive;
export const useRestoreAcademicYearMutation = academicYears.useRestore;

export const useSemesters = semesters.useList;
export const useSemester = semesters.useDetail;
export const useCreateSemesterMutation = semesters.useCreate;
export const useUpdateSemesterMutation = semesters.useUpdate;
export const useArchiveSemesterMutation = semesters.useArchive;
export const useRestoreSemesterMutation = semesters.useRestore;

export const useSections = sections.useList;
export const useSection = sections.useDetail;
export const useCreateSectionMutation = sections.useCreate;
export const useUpdateSectionMutation = sections.useUpdate;
export const useArchiveSectionMutation = sections.useArchive;
export const useRestoreSectionMutation = sections.useRestore;

export const useBatches = batches.useList;
export const useBatch = batches.useDetail;
export const useCreateBatchMutation = batches.useCreate;
export const useUpdateBatchMutation = batches.useUpdate;
export const useArchiveBatchMutation = batches.useArchive;
export const useRestoreBatchMutation = batches.useRestore;

export const useAcademicCalendars = academicCalendars.useList;
export const useAcademicCalendar = academicCalendars.useDetail;
export const useCreateAcademicCalendarMutation = academicCalendars.useCreate;
export const useUpdateAcademicCalendarMutation = academicCalendars.useUpdate;
export const useArchiveAcademicCalendarMutation = academicCalendars.useArchive;
export const useRestoreAcademicCalendarMutation = academicCalendars.useRestore;
