/**
 * Shared domain error codes — AUTH_001, COURSE_001, …
 * Prefer these in new APIs; generic HTTP codes remain in ERROR_CODES / API_ERROR_CODES.
 */

export {
  ERROR_CODES,
  ERROR_MESSAGES,
  type ErrorCode,
} from '@learnova/constants';

/** Domain-scoped subsets for typed handlers */
export const AUTH_ERRORS = {
  AUTH_001: 'AUTH_001',
  AUTH_002: 'AUTH_002',
  AUTH_003: 'AUTH_003',
  AUTH_004: 'AUTH_004',
} as const;

export const COURSE_ERRORS = {
  COURSE_001: 'COURSE_001',
  COURSE_002: 'COURSE_002',
  COURSE_003: 'COURSE_003',
} as const;

export const EXAM_ERRORS = {
  EXAM_001: 'EXAM_001',
  EXAM_002: 'EXAM_002',
  EXAM_003: 'EXAM_003',
  EXAM_004: 'EXAM_004',
} as const;

export const LAB_ERRORS = {
  LAB_001: 'LAB_001',
  LAB_002: 'LAB_002',
  LAB_003: 'LAB_003',
  LAB_004: 'LAB_004',
} as const;
