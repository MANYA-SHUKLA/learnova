/**
 * Shared HTTP / domain error code constants.
 * Prefer domain codes (AUTH_001) in APIs; keep legacy names for AppError mapping.
 */

export const ERROR_CODES = {
  // Generic HTTP-aligned
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  BAD_REQUEST: 'BAD_REQUEST',

  // Auth
  AUTH_001: 'AUTH_001', // Missing or invalid credentials
  AUTH_002: 'AUTH_002', // Token expired / invalid
  AUTH_003: 'AUTH_003', // Insufficient permissions
  AUTH_004: 'AUTH_004', // Session revoked

  // Course / LMS
  COURSE_001: 'COURSE_001', // Course not found
  COURSE_002: 'COURSE_002', // Enrollment required
  COURSE_003: 'COURSE_003', // Course capacity exceeded

  // Exam
  EXAM_001: 'EXAM_001', // Exam not found
  EXAM_002: 'EXAM_002', // Exam not open
  EXAM_003: 'EXAM_003', // Attempt limit reached
  EXAM_004: 'EXAM_004', // Proctoring violation

  // Lab / coding / IDE
  LAB_001: 'LAB_001', // Lab not found
  LAB_002: 'LAB_002', // Runner unavailable
  LAB_003: 'LAB_003', // Submission rejected
  LAB_004: 'LAB_004', // IDE session failed
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  VALIDATION_ERROR: 'Validation failed',
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Forbidden',
  NOT_FOUND: 'Resource not found',
  CONFLICT: 'Conflict',
  RATE_LIMITED: 'Too many requests',
  INTERNAL_ERROR: 'Internal server error',
  SERVICE_UNAVAILABLE: 'Service unavailable',
  BAD_REQUEST: 'Bad request',
  AUTH_001: 'Invalid credentials',
  AUTH_002: 'Invalid or expired token',
  AUTH_003: 'Insufficient permissions',
  AUTH_004: 'Session revoked',
  COURSE_001: 'Course not found',
  COURSE_002: 'Enrollment required',
  COURSE_003: 'Course capacity exceeded',
  EXAM_001: 'Exam not found',
  EXAM_002: 'Exam is not open',
  EXAM_003: 'Attempt limit reached',
  EXAM_004: 'Proctoring violation',
  LAB_001: 'Lab not found',
  LAB_002: 'Code runner unavailable',
  LAB_003: 'Submission rejected',
  LAB_004: 'IDE session failed',
};
