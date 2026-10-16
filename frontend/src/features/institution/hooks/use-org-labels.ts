'use client';

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

const LIMIT = 200;

export function useOrgLabels() {
  const campuses = useCampuses({ limit: LIMIT });
  const schools = useSchools({ limit: LIMIT });
  const departments = useDepartments({ limit: LIMIT });
  const programs = usePrograms({ limit: LIMIT });
  const years = useAcademicYears({ limit: LIMIT });
  const semesters = useSemesters({ limit: LIMIT });
  const sections = useSections({ limit: LIMIT });
  const batches = useBatches({ limit: LIMIT });

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
