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

  bulkIssue: (courseId: string) =>
    apiClient.post<{ issued: number }>(`${base}/bulk-issue`, {
      documentType: 'course_completion',
      courseId,
    }),

  revoke: (certificateId: string, reason: string) =>
    apiClient.post<Record<string, unknown>>(`${base}/revoke`, { certificateId, reason }),

  verify: (code: string) =>
    apiClient.get<Record<string, unknown>>(`${base}/verify${toQuery({ code })}`),

  listTranscripts: (params?: Record<string, string | undefined>) =>
    apiClient.get<{ items: Array<Record<string, unknown>> }>(
      `${base}/transcripts${toQuery(params ?? {})}`,
    ),

  issueTranscript: (body: Record<string, unknown>) =>
    apiClient.post<Record<string, unknown>>(`${base}/transcripts`, body),

  institutionDashboard: () =>
    apiClient.get<{
      issuedCount: number;
      revokedCount: number;
      pendingEligible: number;
      transcriptCount: number;
    }>(`${base}/dashboard/institution`),

  studentDashboard: () =>
    apiClient.get<{
      certificateCount: number;
      transcriptCount: number;
      recentCertificates: Array<Record<string, unknown>>;
    }>(`${base}/dashboard/student`),
};
