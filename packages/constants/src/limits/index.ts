export const LIMITS = {
  MAX_PAGE_SIZE: 100,
  MAX_UPLOAD_BYTES: 10 * 1024 * 1024,
  MAX_STRING_LENGTH: 10_000,
  MAX_SEARCH_LENGTH: 200,
  MAX_BATCH_SIZE: 100,
  DEFAULT_REQUEST_TIMEOUT_MS: 30_000,
} as const;

/** Same seat caps for every institution — not configurable per tenant. */
export const INSTITUTION_MAX_STUDENTS = 1000;
export const INSTITUTION_MAX_FACULTY = 50;
