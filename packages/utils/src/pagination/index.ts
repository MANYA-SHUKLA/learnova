import { PAGINATION } from '@learnova/constants';

export interface PaginationInput {
  page?: number;
  limit?: number;
}

export interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export function normalizePagination(input: PaginationInput = {}): {
  page: number;
  limit: number;
  skip: number;
} {
  const page = Math.max(1, input.page ?? PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(
    PAGINATION.MAX_LIMIT,
    Math.max(1, input.limit ?? PAGINATION.DEFAULT_LIMIT),
  );
  return { page, limit, skip: (page - 1) * limit };
}

export function buildPaginatedMeta(
  total: number,
  page: number,
  limit: number,
): PaginatedMeta {
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}
