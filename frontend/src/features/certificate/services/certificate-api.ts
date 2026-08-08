import { API_ROUTES } from '@learnova/constants';
import { apiClient } from '@/lib/api/client';

const base = API_ROUTES.CERTIFICATES;

function toQuery(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const certificateApi = {
  list: async (params?: Record<string, string | undefined>) => {
    const { data, meta } = await apiClient.getWithMeta<{ items: Array<Record<string, unknown>> }>(
      `${base}${toQuery({ page: 1, limit: 50, ...params })}`,
    );
    return { items: data.items, meta };
  },

  issue: (body: Record<string, unknown>) =>
    apiClient.post<Record<string, unknown>>(`${base}/issue`, body),

  bulkIssue: (courseId: string, publish = false) =>
    apiClient.post<{ issued: number }>(`${base}/bulk-issue`, {
      documentType: 'course_completion',
      courseId,
      publish,
    }),

  publish: (certificateId: string) =>
    apiClient.post<Record<string, unknown>>(`${base}/publish`, { certificateId }),

  revoke: (certificateId: string, reason: string) =>
    apiClient.post<Record<string, unknown>>(`${base}/revoke`, { certificateId, reason }),

  verify: (code: string) =>
    apiClient.get<Record<string, unknown>>(`${base}/verify${toQuery({ code })}`),

  verifyPublic: (verificationCode: string) =>
    apiClient.get<Record<string, unknown>>(`/verify/${encodeURIComponent(verificationCode)}`),

  getPublicByNumber: (certificateNumber: string) =>
    apiClient.get<Record<string, unknown>>(
      `/certificate/${encodeURIComponent(certificateNumber)}`,
    ),

  downloadHtml: async (certificateId: string) => {
    const response = await fetch(
      `${process.env['NEXT_PUBLIC_API_URL'] ?? ''}/api/v1${base}/${certificateId}/download`,
      { credentials: 'include' },
    );
    return response.text();
  },

  listTranscripts: (params?: Record<string, string | undefined>) =>
    apiClient.get<{ items: Array<Record<string, unknown>> }>(
      `${base}/transcripts${toQuery(params ?? {})}`,
    ),

  issueTranscript: (body: Record<string, unknown>) =>
    apiClient.post<Record<string, unknown>>(`${base}/transcripts`, body),

  getAcademicRecord: (params?: Record<string, string | undefined>) =>
    apiClient.get<Record<string, unknown>>(`${base}/academic-record${toQuery(params ?? {})}`),

  listEligibleStudents: (courseId: string, documentType = 'course_completion') =>
    apiClient.get<{ items: Array<Record<string, unknown>>; total: number }>(
      `${base}/eligible-students${toQuery({ courseId, documentType })}`,
    ),

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

  studentDashboard: () =>
    apiClient.get<{
      certificateCount: number;
      transcriptCount: number;
      recentCertificates: Array<Record<string, unknown>>;
    }>(`${base}/dashboard/student`),
};
