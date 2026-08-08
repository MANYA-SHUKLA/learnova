'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { certificateApi } from './services/certificate-api';

export const certificateKeys = {
  all: ['certificates'] as const,
  list: (params?: Record<string, string | undefined>) =>
    [...certificateKeys.all, 'list', params] as const,
  institutionDashboard: () => [...certificateKeys.all, 'institution-dashboard'] as const,
  studentDashboard: () => [...certificateKeys.all, 'student-dashboard'] as const,
  transcripts: (params?: Record<string, string | undefined>) =>
    [...certificateKeys.all, 'transcripts', params] as const,
};

export function useCertificateList(params?: Record<string, string | undefined>, enabled = true) {
  return useQuery({
    queryKey: certificateKeys.list(params),
    queryFn: () => certificateApi.list(params),
    enabled,
  });
}

export function useInstitutionCertificateDashboard() {
  return useQuery({
    queryKey: certificateKeys.institutionDashboard(),
    queryFn: () => certificateApi.institutionDashboard(),
  });
}

export function useStudentCertificateDashboard() {
  return useQuery({
    queryKey: certificateKeys.studentDashboard(),
    queryFn: () => certificateApi.studentDashboard(),
  });
}

export function useBulkIssueCertificatesMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => certificateApi.bulkIssue(courseId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: certificateKeys.all });
    },
  });
}

export function useIssueTranscriptMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => certificateApi.issueTranscript(body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: certificateKeys.all });
    },
  });
}

export function useVerifyCertificateQuery(code: string, enabled: boolean) {
  return useQuery({
    queryKey: [...certificateKeys.all, 'verify', code],
    queryFn: () => certificateApi.verify(code),
    enabled: enabled && code.length >= 8,
  });
}
