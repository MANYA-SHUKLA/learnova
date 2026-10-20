/** Single-segment paths reserved for app routes — not institution slugs. */
export const RESERVED_CAMPUS_SLUGS = new Set([
  'login',
  'register',
  'register-institution',
  'forgot-password',
  'reset-password',
  'verify-email',
  'console',
  'superadmin',
  'platform',
  'campus',
  'campus-guide',
  'features',
  'about',
  'contact',
  'privacy',
  'terms',
  'security',
  'dashboard',
  'institution',
  'faculty',
  'student',
  'admin',
  'forbidden',
  'unauthorized',
  'notifications',
  'account',
  'sessions',
  'verify',
]);

export function campusPublicPath(slug: string): string {
  return `/${slug.toLowerCase()}`;
}

/** Campus-scoped sign-in (one URL per institution). */
export function campusLoginPath(slug: string): string {
  return `/${slug.toLowerCase()}/login`;
}

export function campusGuidePath(slug: string): string {
  return `/${slug.toLowerCase()}/guide`;
}

export function isReservedCampusSlug(slug: string): boolean {
  return RESERVED_CAMPUS_SLUGS.has(slug.toLowerCase());
}
