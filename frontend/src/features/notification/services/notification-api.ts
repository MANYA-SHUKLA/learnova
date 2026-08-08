import { API_ROUTES } from '@learnova/constants';
import { apiClient } from '@/lib/api/client';

const base = API_ROUTES.NOTIFICATIONS;

function toQuery(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export interface NotificationRow {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt?: string;
  data?: Record<string, unknown>;
}

export const notificationApi = {
  list: async (params?: { q?: string; unreadOnly?: boolean; page?: number; limit?: number }) => {
    const { data, meta } = await apiClient.getWithMeta<{
      items: NotificationRow[];
      unreadCount: number;
    }>(
      `${base}${toQuery({
        q: params?.q,
        unreadOnly: params?.unreadOnly ? 'true' : undefined,
        page: params?.page ?? 1,
        limit: params?.limit ?? 25,
      })}`,
    );
    return { items: data.items, unreadCount: data.unreadCount, meta };
  },

  unreadCount: () => apiClient.get<{ unreadCount: number }>(`${base}/unread-count`),

  markRead: (notificationId: string) =>
    apiClient.post(`${base}/${notificationId}/read`, {}),

  markAllRead: () => apiClient.post(`${base}/read-all`, {}),

  delete: (notificationId: string) => apiClient.delete(`${base}/${notificationId}`),

  createAnnouncement: (body: { courseId: string; title: string; body: string }) =>
    apiClient.post(`${base}/announcements`, body),
};
