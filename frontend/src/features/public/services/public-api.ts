import type { PublicInstitutionSummary, PublicPortalPayload } from '@learnova/types';
import { apiClient } from '@/lib/api/client';

export type PlatformMarketingContent = {
  heroTitle: string;
  heroSubtitle: string;
  heroCtaLabel: string;
  features: { title: string; body: string }[];
  pricingTitle: string | null;
  pricingBody: string | null;
  faq: { title: string; body: string }[];
  footerNote: string | null;
};

export const publicApi = {
  getPortal(slug?: string) {
    const query = slug ? `?slug=${encodeURIComponent(slug)}` : '';
    return apiClient.get<PublicPortalPayload>(`/public/portal${query}`, { auth: false });
  },

  listInstitutions() {
    return apiClient.get<{ items: PublicInstitutionSummary[] }>('/public/institutions', {
      auth: false,
    });
  },

  getPlatformMarketing() {
    return apiClient.get<PlatformMarketingContent>('/public/platform-marketing', { auth: false });
  },

  createDemoRequest(body: {
    institutionName: string;
    contactName: string;
    contactEmail: string;
    phone: string;
    message?: string;
  }) {
    return apiClient.post('/public/demo-requests', body, { auth: false });
  },
};
