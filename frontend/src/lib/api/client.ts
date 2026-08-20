/**
 * Typed API client foundation.
 * Transport + error mapping. Always sends credentials for HttpOnly refresh cookie.
 */

import type { ApiErrorResponse, ApiResponse, PaginatedMeta } from '@learnova/types';
import { HTTP_HEADERS } from '@learnova/constants';
import { env } from '@/config/env';
import { getAccessToken } from '@/lib/auth/jwt';

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
    public readonly requestId: string,
    public readonly details?: ApiErrorResponse['error']['details'],
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiClientError) {
    if (error.details?.length) {
      return error.details
        .map((detail) => (detail.field ? `${detail.field}: ${detail.message}` : detail.message))
        .join('. ');
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

function createRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `req_${String(Date.now())}_${Math.random().toString(36).slice(2, 10)}`;
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  auth?: boolean;
  requestId?: string;
}

export interface ApiResultWithMeta<T> {
  data: T;
  meta?: PaginatedMeta;
}

async function requestRaw<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiResultWithMeta<T>> {
  const { body, auth = true, requestId = createRequestId(), headers, ...rest } = options;

  const finalHeaders = new Headers(headers);
  finalHeaders.set('Accept', 'application/json');
  finalHeaders.set(HTTP_HEADERS.REQUEST_ID, requestId);

  if (body !== undefined) {
    finalHeaders.set('Content-Type', 'application/json');
  }

  if (auth) {
    const token = getAccessToken();
    if (token) {
      finalHeaders.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(`${env.NEXT_PUBLIC_API_URL}${path}`, {
    ...rest,
    credentials: 'include',
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const json = (await response.json()) as ApiResponse<T>;

  if (!json.success) {
    throw new ApiClientError(
      json.error.message,
      json.error.code,
      response.status,
      json.requestId,
      json.error.details,
    );
  }

  return { data: json.data, meta: json.meta };
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const result = await requestRaw<T>(path, options);
  return result.data;
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'GET' }),
  getWithMeta: <T>(path: string, options?: RequestOptions) =>
    requestRaw<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};
