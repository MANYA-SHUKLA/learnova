'use client';

import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../services/reports-api';

export const reportsKeys = {
  all: ['reports'] as const,
  institution: (params?: { departmentId?: string; semesterId?: string }) =>
    [...reportsKeys.all, 'institution', params] as const,
  faculty: (courseId: string) => [...reportsKeys.all, 'faculty', courseId] as const,
  student: () => [...reportsKeys.all, 'student'] as const,
};

export function useInstitutionReport(params?: { departmentId?: string; semesterId?: string }) {
  return useQuery({
    queryKey: reportsKeys.institution(params),
    queryFn: () => reportsApi.institution(params),
    staleTime: 60_000,
  });
}

export function useFacultyReport(courseId: string, enabled = true) {
  return useQuery({
    queryKey: reportsKeys.faculty(courseId),
    queryFn: () => reportsApi.faculty(courseId),
    enabled: enabled && Boolean(courseId),
    staleTime: 60_000,
  });
}

export function useStudentReport() {
  return useQuery({
    queryKey: reportsKeys.student(),
    queryFn: () => reportsApi.student(),
    staleTime: 60_000,
  });
}
