import { PAGINATION } from '@learnova/constants';

interface PagedResult<T> {
  items: T[];
  meta: { totalPages: number; total: number };
}

/** Fetches every page from a paginated list API (respects server max limit per page). */
export async function fetchAllListPages<T>(
  fetchPage: (page: number, limit: number) => Promise<PagedResult<T>>,
  limit = PAGINATION.MAX_LIMIT,
): Promise<{ items: T[]; total: number }> {
  const first = await fetchPage(1, limit);
  const items = [...first.items];
  for (let page = 2; page <= first.meta.totalPages; page += 1) {
    const next = await fetchPage(page, limit);
    items.push(...next.items);
  }
  return { items, total: first.meta.total };
}
