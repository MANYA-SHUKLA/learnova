import type { ApiErrorResponse, ApiSuccessResponse, PaginatedMeta } from '@learnova/types';
import type { Response } from 'express';

export interface CursorMeta {
  nextCursor: string | null;
  prevCursor: string | null;
  hasMore: boolean;
  limit: number;
}

function requestIdFrom(res: Response, explicit?: string): string {
  if (explicit !== undefined) return explicit;
  const header = res.getHeader('x-request-id');
  return header === undefined ? '' : String(header);
}

/**
 * Centralized response wrapper — all controllers use these helpers.
 */
export function sendSuccess(
  res: Response,
  data: unknown,
  options?: {
    status?: number;
    message?: string;
    meta?: PaginatedMeta;
    requestId?: string;
  },
): Response {
  const body: ApiSuccessResponse<unknown> = {
    success: true,
    data,
    message: options?.message,
    meta: options?.meta,
    requestId: requestIdFrom(res, options?.requestId),
    timestamp: new Date().toISOString(),
  };
  return res.status(options?.status ?? 200).json(body);
}

export function sendCreated(
  res: Response,
  data: unknown,
  options?: { message?: string; requestId?: string },
): Response {
  return sendSuccess(res, data, { ...options, status: 201 });
}

export function sendPaginated(
  res: Response,
  items: unknown[],
  meta: PaginatedMeta,
  options?: { message?: string; requestId?: string },
): Response {
  return sendSuccess(res, { items }, { ...options, meta });
}

export function sendCursorPage(
  res: Response,
  items: unknown[],
  cursor: CursorMeta,
  options?: { message?: string; requestId?: string },
): Response {
  return res.status(200).json({
    success: true,
    data: { items },
    cursor,
    message: options?.message,
    requestId: requestIdFrom(res, options?.requestId),
    timestamp: new Date().toISOString(),
  });
}

export function sendValidationError(
  res: Response,
  options: {
    message?: string;
    details?: ApiErrorResponse['error']['details'];
    requestId?: string;
  },
): Response {
  return sendError(res, {
    status: 400,
    code: 'VALIDATION_ERROR',
    message: options.message ?? 'Validation failed',
    details: options.details,
    requestId: options.requestId,
  });
}

export function sendError(
  res: Response,
  options: {
    status: number;
    code: string;
    message: string;
    details?: ApiErrorResponse['error']['details'];
    metadata?: Record<string, unknown>;
    requestId?: string;
  },
): Response {
  const body: ApiErrorResponse & { error: ApiErrorResponse['error'] & { metadata?: Record<string, unknown> } } = {
    success: false,
    error: {
      code: options.code,
      message: options.message,
      details: options.details,
      ...(options.metadata ? { metadata: options.metadata } : {}),
    },
    requestId: requestIdFrom(res, options.requestId),
    timestamp: new Date().toISOString(),
  };
  return res.status(options.status).json(body);
}

export function sendNoContent(res: Response): Response {
  return res.status(204).send();
}
