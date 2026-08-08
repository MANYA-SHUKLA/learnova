import { API_ROUTES } from '@learnova/constants';
import type { UpsertCertificateTemplateInput } from '@learnova/validation';
import { apiClient } from '@/lib/api/client';
import type {
  CertificateAuditRow,
  CertificateRow,
  CertificateTemplateRow,
  EligibleStudentRow,
} from '../types';

const base = API_ROUTES.CERTIFICATES;

function toQuery(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

function mapCertificate(row: Record<string, unknown>): CertificateRow {
  return {
    id: String(row['id'] ?? row['_id']),
    title: row['title'] as string | undefined,
    documentType: row['documentType'] as string | undefined,
    certificateNumber: row['certificateNumber'] as string | undefined,
    verificationCode: row['verificationCode'] as string | undefined,
    verificationURL: row['verificationURL'] as string | undefined,
    status: row['status'] as string | undefined,
  };
}

export const certificateApi = {
  list: async (params?: Record<string, string | undefined>) => {
    const { data, meta } = await apiClient.getWithMeta<{ items: Record<string, unknown>[] }>(
      `${base}${toQuery({ page: 1, limit: 50, ...params })}`,
    );
    return { items: data.items.map(mapCertificate), meta };
  },

  listTemplates: async (documentType?: string) => {
    const { items } = await apiClient.get<{ items: Record<string, unknown>[] }>(
      `${base}/templates${toQuery({ documentType })}`,
    );
    return items.map(
      (row): CertificateTemplateRow => ({
        id: String(row['id'] ?? row['_id']),
        name: String(row['name'] ?? 'Template'),
        documentType: row['documentType'] as string | undefined,
        titleTemplate: row['titleTemplate'] as string | undefined,
        active: row['active'] as boolean | undefined,
      }),
    );
  },

  createTemplate: (body: UpsertCertificateTemplateInput) =>
    apiClient.post<CertificateTemplateRow>(`${base}/templates`, body),

  issue: (body: {
    studentId: string;
    documentType: string;
    courseId?: string;
    publish?: boolean;
    templateId?: string;
  }) => apiClient.post<CertificateRow>(`${base}/issue`, body),

  bulkIssue: (courseId: string, publish = false) =>
    apiClient.post<{ issued: number }>(`${base}/bulk-issue`, {
      documentType: 'course_completion',
      courseId,
      publish,
    }),

  publish: (certificateId: string) =>
    apiClient.post<CertificateRow>(`${base}/publish`, { certificateId }),

  revoke: (certificateId: string, reason: string) =>
    apiClient.post<CertificateRow>(`${base}/revoke`, { certificateId, reason }),

  verify: (code: string) =>
    apiClient.get<Record<string, unknown>>(`${base}/verify${toQuery({ code })}`),

  verifyPublic: (verificationCode: string) =>
    apiClient.get<Record<string, unknown>>(`/verify/${encodeURIComponent(verificationCode)}`),

  downloadHtml: async (certificateId: string) => {
    const response = await fetch(
      `${process.env['NEXT_PUBLIC_API_URL'] ?? ''}/api/v1${base}/${certificateId}/download`,
      { credentials: 'include' },
    );
    return response.text();
  },

  listEligibleStudents: (courseId: string, documentType = 'course_completion') =>
    apiClient.get<{ items: EligibleStudentRow[]; total: number }>(
      `${base}/eligible-students${toQuery({ courseId, documentType })}`,
    ),

  listAuditLogs: (params?: { certificateId?: string; limit?: number }) =>
    apiClient.get<{ items: CertificateAuditRow[] }>(
      `${base}/audit${toQuery(params ?? {})}`,
    ),

  listTranscripts: (params?: Record<string, string | undefined>) =>
    apiClient.get<{ items: Record<string, unknown>[] }>(
      `${base}/transcripts${toQuery(params ?? {})}`,
    ),

  issueTranscript: (body: Record<string, unknown>) =>
    apiClient.post<Record<string, unknown>>(`${base}/transcripts`, body),

  getAcademicRecord: (params?: Record<string, string | undefined>) =>
    apiClient.get<Record<string, unknown>>(`${base}/academic-record${toQuery(params ?? {})}`),

  exportRegistry: () =>
    `${process.env['NEXT_PUBLIC_API_URL'] ?? ''}/api/v1${base}/registry/export`,

  institutionDashboard: () =>
    apiClient.get<{
      issuedCount: number;
      publishedCount: number;
      revokedCount: number;
      pendingEligible: number;
      transcriptCount: number;
      downloadCount: number;
      verificationRequests: number;
    }>(`${base}/dashboard/institution`),

  studentDashboard: async () => {
    const data = await apiClient.get<{
      certificateCount: number;
      transcriptCount: number;
      recentCertificates: Record<string, unknown>[];
    }>(`${base}/dashboard/student`);
    return {
      ...data,
      recentCertificates: data.recentCertificates.map(mapCertificate),
    };
  },
};
