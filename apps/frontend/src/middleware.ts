import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  dashboardPathForRoleCookie,
  isActiveRole,
  isPathAllowedForRole,
  requiredRoleForPath,
} from '@/lib/auth/edge-role-routes';
import { MIDDLEWARE_AUTH } from '@/lib/auth/middleware-auth';
import { routing } from '@/lib/i18n/routing.config';

/**
 * Edge middleware — i18n routing + auth gate via learnova_session cookie.
 *
 * RBAC: JWT verification is not available in Edge middleware, so the app syncs a
 * `learnova_role` cookie on the frontend origin at login (see lib/auth/jwt.ts).
 * Middleware uses role + path prefix rules from role-routes.ts to redirect
 * cross-role navigation. Dashboard layout adds a client-side guard as
 * defense-in-depth; API remains the source of truth via scoped services.
 */

const intlMiddleware = createMiddleware(routing);

/** Routes that require an authenticated session */
const PROTECTED_PATH_PREFIXES = [
  '/dashboard',
  '/sessions',
  '/account',
  '/institution',
  '/student',
  '/faculty',
  '/admin',
  '/lms',
  '/erp',
  '/examination',
  '/coding',
  '/ide',
  '/ideation',
  '/analytics',
  '/audit',
] as const;

/** Auth-only routes (guest) */
const AUTH_PATH_PREFIXES = [
  '/login',
  '/register',
  '/register-institution',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
] as const;

function stripLocale(pathname: string): string {
  const segments = pathname.split('/');
  if (segments.length >= 2) {
    return '/' + segments.slice(2).join('/');
  }
  return pathname;
}

function matchesPrefix(path: string, prefixes: readonly string[]): boolean {
  const normalized = path === '' ? '/' : path;
  return prefixes.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
  );
}

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const pathWithoutLocale = stripLocale(pathname);
  const locale = pathname.split('/')[1] ?? 'en';

  const sessionToken = request.cookies.get(MIDDLEWARE_AUTH.REFRESH_COOKIE_NAME)?.value;
  const isAuthenticated = Boolean(sessionToken);
  const roleCookie = request.cookies.get(MIDDLEWARE_AUTH.ROLE_COOKIE_NAME)?.value ?? null;
  const activeRole = roleCookie && isActiveRole(roleCookie) ? roleCookie : null;

  const isProtected = matchesPrefix(pathWithoutLocale, PROTECTED_PATH_PREFIXES);
  const isAuthRoute = matchesPrefix(pathWithoutLocale, AUTH_PATH_PREFIXES);

  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set('next', pathWithoutLocale);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && isAuthenticated) {
    const home = activeRole ? dashboardPathForRoleCookie(activeRole) : '/dashboard';
    return NextResponse.redirect(new URL(`/${locale}${home}`, request.url));
  }

  const requiredRole = requiredRoleForPath(pathWithoutLocale);
  if (isAuthenticated && requiredRole) {
    if (!activeRole) {
      return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
    }
    if (!isPathAllowedForRole(pathWithoutLocale, activeRole)) {
      const home = dashboardPathForRoleCookie(activeRole);
      return NextResponse.redirect(new URL(`/${locale}${home}`, request.url));
    }
  }

  const response = intlMiddleware(request);
  response.headers.set('x-pathname', pathname);
  return response;
}

export const config = {
  matcher: ['/', '/(en|hi|te)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
};
