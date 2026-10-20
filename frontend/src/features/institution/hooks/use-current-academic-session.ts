'use client';

import { PERMISSIONS } from '@learnova/constants';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { can } from '@/lib/auth/permissions';
import { useAuth } from '@/providers/auth-provider';
import {
  buildAcademicSessionLabel,
  resolveActiveAcademicYear,
  resolveCurrentSemester,
  semesterTermKey,
} from '../utils/academic-session';
import { useAcademicYears, useSemesters } from './use-institution-queries';

const LIST = { limit: 100, status: 'active' as const, page: 1 };

export function useCurrentAcademicSession() {
  const { user, permissions } = useAuth();
  const t = useTranslations('dashboard.institution.session');
  const enabled =
    Boolean(user?.institutionId) && can(permissions, PERMISSIONS.INSTITUTION_READ);

  const yearsQuery = useAcademicYears(LIST, enabled);
  const activeYear = useMemo(
    () => resolveActiveAcademicYear(yearsQuery.data?.items ?? []),
    [yearsQuery.data?.items],
  );

  const semestersQuery = useSemesters(
    { ...LIST, academicYearId: activeYear?.id },
    enabled && Boolean(activeYear?.id),
  );

  const currentSemester = useMemo(
    () => resolveCurrentSemester(semestersQuery.data?.items ?? []),
    [semestersQuery.data?.items],
  );

  const termLabel = currentSemester
    ? t(semesterTermKey(currentSemester.term))
    : '';

  const label = useMemo(
    () =>
      buildAcademicSessionLabel({
        year: activeYear,
        semester: currentSemester,
        termLabel,
      }),
    [activeYear, currentSemester, termLabel],
  );

  const isLoading =
    enabled &&
    (yearsQuery.isLoading || (Boolean(activeYear?.id) && semestersQuery.isLoading));

  return {
    enabled,
    isLoading,
    activeYear,
    currentSemester,
    label,
    needsSetup: enabled && !yearsQuery.isLoading && !activeYear,
    needsSemester:
      enabled &&
      Boolean(activeYear) &&
      !semestersQuery.isLoading &&
      !currentSemester,
  };
}
