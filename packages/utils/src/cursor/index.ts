export interface CursorPaginationInput {
  cursor?: string | null;
  limit?: number;
}

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  prevCursor: string | null;
  hasMore: boolean;
  limit: number;
}

export function normalizeCursorPagination(
  input: CursorPaginationInput = {},
  maxLimit = 100,
  defaultLimit = 20,
): { cursor: string | null; limit: number } {
  const limit = Math.min(maxLimit, Math.max(1, input.limit ?? defaultLimit));
  return { cursor: input.cursor ?? null, limit };
}

export function encodeCursor(payload: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export function decodeCursor(cursor: string): Record<string, unknown> | null {
  try {
    return JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as Record<
      string,
      unknown
    >;
  } catch {
    return null;
  }
}

export function buildCursorPage<T>(
  items: T[],
  limit: number,
  getCursor: (item: T) => string,
  prevCursor: string | null = null,
): CursorPage<T> {
  const hasMore = items.length > limit;
  const pageItems = hasMore ? items.slice(0, limit) : items;
  const lastItem = pageItems[pageItems.length - 1];
  const nextCursor = hasMore && lastItem !== undefined ? getCursor(lastItem) : null;
  return {
    items: pageItems,
    nextCursor,
    prevCursor,
    hasMore,
    limit,
  };
}
