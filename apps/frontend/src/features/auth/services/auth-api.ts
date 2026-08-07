import { apiClient } from '@/lib/api/client';
import type {
  AuthSessionResponse,
  CurrentSessionResponse,
  MeResponse,
  MessageResponse,
  SessionsListResponse,
} from '../types';

const BASE = '/auth';

export const authApi = {
  login(body: { email: string; password: string }) {
    return apiClient.post<AuthSessionResponse>(`${BASE}/login`, body, { auth: false });
  },

  registerInstitution(body: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    institutionName: string;
  }) {
    return apiClient.post<AuthSessionResponse>(`${BASE}/register`, body, { auth: false });
  },

  logout() {
    return apiClient.post<MessageResponse>(`${BASE}/logout`);
  },

  logoutAll() {
    return apiClient.post<MessageResponse>(`${BASE}/logout-all`);
  },

  refresh() {
    return apiClient.post<AuthSessionResponse>(`${BASE}/refresh`, undefined, { auth: false });
  },

  forgotPassword(body: { email: string }) {
    return apiClient.post<MessageResponse>(`${BASE}/forgot-password`, body, { auth: false });
  },

  resetPassword(body: { token: string; password: string }) {
    return apiClient.post<MessageResponse>(`${BASE}/reset-password`, body, { auth: false });
  },

  changePassword(body: { currentPassword: string; newPassword: string }) {
    return apiClient.post<MessageResponse>(`${BASE}/change-password`, body);
  },

  verifyEmail(body: { token: string }) {
    return apiClient.post<MessageResponse>(`${BASE}/verify-email`, body, { auth: false });
  },

  resendVerification(body: { email: string }) {
    return apiClient.post<MessageResponse>(`${BASE}/resend-verification`, body, {
      auth: false,
    });
  },

  async me() {
    const data = await apiClient.get<MeResponse>(`${BASE}/me`);
    return data.user;
  },

  async getSessions() {
    const data = await apiClient.get<SessionsListResponse>(`${BASE}/sessions`);
    return data.sessions;
  },

  revokeSession(sessionId: string) {
    return apiClient.delete<MessageResponse>(`${BASE}/sessions/${sessionId}`);
  },

  async getCurrentSession() {
    const data = await apiClient.get<CurrentSessionResponse>(`${BASE}/session`);
    return data.session;
  },
};
