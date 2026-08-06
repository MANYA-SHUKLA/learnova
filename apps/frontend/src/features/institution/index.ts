/**
 * Institution management feature barrel.
 */

export { institutionApi } from './services/institution-api';
export {
  institutionKeys,
  useMyInstitution,
  useInstitution,
  useInstitutions,
  useUpdateInstitutionMutation,
  useUpdateBrandingMutation,
  useInstitutionSettings,
  useUpdateInstitutionSettingsMutation,
  useCampuses,
  useCampus,
  useCreateCampusMutation,
  useUpdateCampusMutation,
  useArchiveCampusMutation,
  useRestoreCampusMutation,
  useSchools,
  useSchool,
  useCreateSchoolMutation,
  useUpdateSchoolMutation,
  useArchiveSchoolMutation,
  useRestoreSchoolMutation,
  useDepartments,
  useDepartment,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useArchiveDepartmentMutation,
  useRestoreDepartmentMutation,
  usePrograms,
  useProgram,
  useCreateProgramMutation,
  useUpdateProgramMutation,
  useArchiveProgramMutation,
  useRestoreProgramMutation,
  useAcademicYears,
  useAcademicYear,
  useCreateAcademicYearMutation,
  useUpdateAcademicYearMutation,
  useArchiveAcademicYearMutation,
  useRestoreAcademicYearMutation,
  useSemesters,
  useSemester,
  useCreateSemesterMutation,
  useUpdateSemesterMutation,
  useArchiveSemesterMutation,
  useRestoreSemesterMutation,
  useSections,
  useSection,
  useCreateSectionMutation,
  useUpdateSectionMutation,
  useArchiveSectionMutation,
  useRestoreSectionMutation,
  useBatches,
  useBatch,
  useCreateBatchMutation,
  useUpdateBatchMutation,
  useArchiveBatchMutation,
  useRestoreBatchMutation,
  useAcademicCalendars,
  useAcademicCalendar,
  useCreateAcademicCalendarMutation,
  useUpdateAcademicCalendarMutation,
  useArchiveAcademicCalendarMutation,
  useRestoreAcademicCalendarMutation,
} from './hooks/use-institution-queries';
export { PageHeader } from './components/page-header';
export { EmptyState, ErrorState } from './components/empty-state';
export { ExportMenu } from './components/export-menu';
export { BrandingUpload } from './components/branding-upload';
export {
  ResourceTable,
  StatusBadge,
  PaginationControls,
  type ResourceColumn,
} from './components/resource-table';
export {
  ResourceFormDialog,
  type FormField,
  type FormFieldType,
} from './components/resource-form-dialog';
export { ResourceCrudPage } from './components/resource-crud-page';
export { exportToCsv, rowsToCsv, downloadCsv, escapeCsvCell } from './utils/export';
export type * from './types';
