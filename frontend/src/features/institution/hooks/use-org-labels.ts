'use client';

import { PERMISSIONS } from '@learnova/constants';
import { canAny } from '@/lib/auth/permissions';
import { useAuth } from '@/providers/auth-provider';
import { displayName, displayNames } from '../utils/display-name';
import {
  useAcademicYears,
  useBatches,
  useCampuses,
  useDepartments,
  usePrograms,
  useSchools,
  useSections,
  useSemesters,
} from './use-institution-queries';

const LIST = { limit: 100, page: 1 } as const;

const CATALOG_READ = [
  PERMISSIONS.INSTITUTION_READ,
  PERMISSIONS.ERP_READ,
  PERMISSIONS.COURSE_READ,
  PERMISSIONS.TIMETABLE_READ,
] as const;

export function useOrgLabels() {
  const { user, permissions } = useAuth();
  const catalogEnabled =
    Boolean(user?.institutionId) && canAny(permissions, CATALOG_READ);

  const campuses = useCampuses(LIST, catalogEnabled);
  const schools = useSchools(LIST, catalogEnabled);
  const departments = useDepartments(LIST, catalogEnabled);
  const programs = usePrograms(LIST, catalogEnabled);
  const years = useAcademicYears(LIST, catalogEnabled);
  const semesters = useSemesters(LIST, catalogEnabled);
  const sections = useSections(LIST, catalogEnabled);
  const batches = useBatches(LIST, catalogEnabled);

  return {
    campus: (id: string | null | undefined) =>
      displayName(campuses.data?.items, id, (row) => `${row.name} (${row.code})`),
    school: (id: string | null | undefined) =>
      displayName(schools.data?.items, id, (row) => `${row.name} (${row.code})`),
    department: (id: string | null | undefined) =>
      displayName(departments.data?.items, id, (row) => `${row.name} (${row.code})`),
    program: (id: string | null | undefined) =>
      displayName(programs.data?.items, id, (row) => `${row.name} (${row.code})`),
    year: (id: string | null | undefined) =>
      displayName(years.data?.items, id, (row) => row.name),
    semester: (id: string | null | undefined) =>
      displayName(semesters.data?.items, id, (row) => row.name),
    section: (id: string | null | undefined) =>
      displayName(sections.data?.items, id, (row) => row.name),
    batch: (id: string | null | undefined) =>
      displayName(batches.data?.items, id, (row) => row.name),
    programs: (ids: string[]) =>
      displayNames(programs.data?.items, ids, (row) => `${row.name} (${row.code})`),
    semesters: (ids: string[]) => displayNames(semesters.data?.items, ids, (row) => row.name),
  };
}
