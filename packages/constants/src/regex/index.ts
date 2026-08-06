/** Shared regex patterns — single source for validators & sanitizers */

export const REGEX = {
  OBJECT_ID: /^[a-f\d]{24}$/i,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  COURSE_CODE: /^[A-Z]{2,6}-?\d{2,4}$/,
  PASSWORD_STRONG: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{12,128}$/,
  PHONE_E164: /^\+[1-9]\d{7,14}$/,
  HEX_COLOR: /^#([0-9a-f]{3}|[0-9a-f]{6})$/i,
} as const;
