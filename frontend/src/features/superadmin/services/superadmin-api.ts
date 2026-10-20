import type { PaginatedMeta } from '@learnova/types';
import { apiClient } from '@/lib/api/client';
import type { PlatformMarketingContent } from '@/features/public/services/public-api';

export type InstitutionAdminLoginRow = {
  id: string;
  email: string;
  institutionId: string | null;
  institutionName: string | null;
  loggedInAt: string | null;
  ipAddress: string | null;
};

export type DemoRequestRow = {
  id: string;
  institutionName: string;
  contactName: string;
  contactEmail: string;
  phone: string;
  message: string | null;
  status: string;
  meetingAt: string | null;
  meetingNotes: string | null;
  institutionId: string | null;
  createdAt: string | null;
};

export const superadminApi = {
  login(body: { email: string; password: string }) {
    return apiClient.post('/auth/super-admin/login', body, { auth: false });
  },

  listInstitutionAdminLogins(params?: { page?: number; limit?: number }) {
    const search = new URLSearchParams();
    if (params?.page) search.set('page', String(params.page));
    if (params?.limit) search.set('limit', String(params.limit));
    const q = search.toString();
    return apiClient.get<{ items: InstitutionAdminLoginRow[]; meta: PaginatedMeta }>(
      `/super-admin/institution-admin-logins${q ? `?${q}` : ''}`,
    );
  },

  listDemoRequests(params?: { page?: number; status?: string }) {
    const search = new URLSearchParams();
    if (params?.page) search.set('page', String(params.page));
    if (params?.status) search.set('status', params.status);
    const q = search.toString();
    return apiClient.get<{ items: DemoRequestRow[]; meta: PaginatedMeta }>(
      `/super-admin/demo-requests${q ? `?${q}` : ''}`,
    );
  },

  confirmDemoRequest(id: string, body: { meetingAt: string; meetingNotes?: string }) {
    return apiClient.post<DemoRequestRow>(`/super-admin/demo-requests/${id}/confirm`, body);
  },

  declineDemoRequest(id: string, body?: { reason?: string }) {
    return apiClient.post<DemoRequestRow>(`/super-admin/demo-requests/${id}/decline`, body ?? {});
  },

  provisionCampus(body: Record<string, unknown>) {
    return apiClient.post<{
      institutionId: string;
      institutionSlug: string;
      institutionCode: string;
      adminUserId: string;
      credentialsEmailSent: boolean;
    }>('/super-admin/institutions', body);
  },

  listInstitutions() {
    return apiClient.get<{ items: unknown[] }>('/institutions?limit=100');
  },

  resendCredentials(institutionId: string, body?: { rotatePassword?: boolean; newPassword?: string }) {
    return apiClient.post(`/super-admin/institutions/${institutionId}/resend-admin-credentials`, body ?? {});
  },

  getMarketing() {
    return apiClient.get<PlatformMarketingContent>('/super-admin/platform-marketing');
  },

  updateMarketing(body: PlatformMarketingContent) {
    return apiClient.put<PlatformMarketingContent>('/super-admin/platform-marketing', body);
  },
};
