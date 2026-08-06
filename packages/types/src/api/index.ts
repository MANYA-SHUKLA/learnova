/**
 * Centralized API contract types.
 * All HTTP responses must conform to ApiResponse / ApiErrorResponse.
 */

import type { PaginatedMeta } from '../common/index.js';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  meta?: PaginatedMeta;
  requestId: string;
  timestamp: string;
}

export interface ApiErrorDetail {
  field?: string;
  code: string;
  message: string;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: ApiErrorDetail[];
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorBody;
  requestId: string;
  timestamp: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface ApiListData<T> {
  items: T[];
  meta: PaginatedMeta;
}

/**
 * Standard error codes used across services.
 * Domain codes (AUTH_001, COURSE_001, …) live in @learnova/constants / @learnova/shared/errors.
 */
export const API_ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  BAD_REQUEST: 'BAD_REQUEST',
  AUTH_001: 'AUTH_001',
  AUTH_002: 'AUTH_002',
  AUTH_003: 'AUTH_003',
  AUTH_004: 'AUTH_004',
  COURSE_001: 'COURSE_001',
  COURSE_002: 'COURSE_002',
  COURSE_003: 'COURSE_003',
  EXAM_001: 'EXAM_001',
  EXAM_002: 'EXAM_002',
  EXAM_003: 'EXAM_003',
  EXAM_004: 'EXAM_004',
  LAB_001: 'LAB_001',
  LAB_002: 'LAB_002',
  LAB_003: 'LAB_003',
  LAB_004: 'LAB_004',
} as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];