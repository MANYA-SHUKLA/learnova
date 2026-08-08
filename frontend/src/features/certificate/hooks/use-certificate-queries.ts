'use client';

import type { UpsertCertificateTemplateInput } from '@learnova/validation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { certificateApi } from '../services/certificate-api';

export const certificateKeys = {
  all: ['certificates'] as const,
  list: (params?: Record<string, string | undefined>) =>
    [...certificateKeys.all, 'list', params] as const,
  templates: (documentType?: string) =>
    [...certificateKeys.all, 'templates', documentType] as const,
  institutionDashboard: () => [...certificateKeys.all, 'institution-dashboard'] as const,
  studentDashboard: () => [...certificateKeys.all, 'student-dashboard'] as const,
  eligible: (courseId: string) => [...certificateKeys.all, 'eligible', courseId] as const,
  audit: () => [...certificateKeys.all, 'audit'] as const,
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

export function useCertificateTemplates(documentType?: string) {
  return useQuery({
    queryKey: certificateKeys.templates(documentType),
    queryFn: () => certificateApi.listTemplates(documentType),
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

export function useEligibleStudentsQuery(courseId: string, enabled = true) {
  return useQuery({
    queryKey: certificateKeys.eligible(courseId),
    queryFn: () => certificateApi.listEligibleStudents(courseId),
    enabled: enabled && Boolean(courseId),
  });
}

export function useCertificateAuditQuery(enabled = true) {
  return useQuery({
    queryKey: certificateKeys.audit(),
    queryFn: async () => {
      const { items } = await certificateApi.listAuditLogs({ limit: 25 });
      return items;
    },
    enabled,
  });
}

export function useBulkIssueCertificatesMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, publish }: { courseId: string; publish?: boolean }) =>
      certificateApi.bulkIssue(courseId, publish),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: certificateKeys.all });
    },
  });
}

export function useIssueCertificateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: certificateApi.issue,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: certificateKeys.all });
    },
  });
}

export function useRevokeCertificateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ certificateId, reason }: { certificateId: string; reason: string }) =>
      certificateApi.revoke(certificateId, reason),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: certificateKeys.all });
    },
  });
}

export function useCreateCertificateTemplateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpsertCertificateTemplateInput) => certificateApi.createTemplate(body),
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
    queryFn: () => certificateApi.verifyPublic(code),
    enabled: enabled && code.length >= 8,
  });
}
