/** Search helpers */

export function normalizeSearchQuery(q: string | undefined | null): string {
  return (q ?? '').trim().replace(/\s+/g, ' ');
}

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Build a case-insensitive Mongo-friendly regex source from user query */
export function toSearchRegexSource(q: string): string {
  const normalized = normalizeSearchQuery(q);
  if (!normalized) return '';
  return escapeRegex(normalized)
    .split(' ')
    .filter(Boolean)
    .join('.*');
}
