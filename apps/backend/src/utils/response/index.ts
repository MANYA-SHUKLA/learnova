import type { ApiErrorResponse, ApiSuccessResponse, PaginatedMeta } from '@learnova/types';
import type { Response } from 'express';

/**
 * Centralized response wrapper — all controllers use these helpers.
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  options?: {
    status?: number;
    message?: string;
    meta?: PaginatedMeta;
    requestId?: string;
  },
): Response {
  const body: ApiSuccessResponse<T> = {
    success: true,
    data,
    message: options?.message,
    meta: options?.meta,
    requestId: options?.requestId ?? (res.getHeader('x-request-id') as string) ?? '',
    timestamp: new Date().toISOString(),
  };
  return res.status(options?.status ?? 200).json(body);
}

export function sendCreated<T>(
  res: Response,
  data: T,
  options?: { message?: string; requestId?: string },
): Response {
  return sendSuccess(res, data, { ...options, status: 201 });
}

export function sendError(
  res: Response,
  options: {
    status: number;
    code: string;
    message: string;
    details?: ApiErrorResponse['error']['details'];
    requestId?: string;
  },
): Response {
  const body: ApiErrorResponse = {
    success: false,
    error: {
      code: options.code,
      message: options.message,
      details: options.details,
    },
    requestId: options.requestId ?? (res.getHeader('x-request-id') as string) ?? '',
    timestamp: new Date().toISOString(),
  };
  return res.status(options.status).json(body);
}

export function sendNoContent(res: Response): Response {
  return res.status(204).send();
}
