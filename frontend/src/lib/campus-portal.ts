import type { PublicPortalPayload } from '@learnova/types';
import { env } from '@/config/env';

export async function fetchPublicPortal(slug: string): Promise<PublicPortalPayload | null> {
  const base = env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  const res = await fetch(`${base}/public/portal?slug=${encodeURIComponent(slug)}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { data: PublicPortalPayload };
  return json.data;
}
