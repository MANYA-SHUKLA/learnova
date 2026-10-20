import { APP_ROUTES } from '@learnova/constants';
import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  dashboardPathForRoleCookie,
  isPathAllowedForRole,
  requiredRoleForPath,
} from '@/lib/auth/edge-role-routes';
import { parseRoleCookie } from '@/lib/auth/role-hint-edge';
import { MIDDLEWARE_AUTH } from '@/lib/auth/middleware-auth';
import { routing } from '@/lib/i18n/routing.config';

/**
 * Edge middleware — i18n routing + auth gate via learnova_session cookie.
 *
 * RBAC: JWT verification is not available in Edge middleware, so the API returns a
 * signed `roleHint` at login/refresh; the frontend stores it in `learnova_role`.
 * Middleware verifies the HMAC before applying path prefix rules. Dashboard layout
 * adds a client-side guard as defense-in-depth; API remains the source of truth.
 */

const intlMiddleware = createMiddleware(routing);

/** Routes that require an authenticated session */
const PROTECTED_PATH_PREFIXES = [
  '/dashboard',
  '/sessions',
  '/account',
  '/notifications',
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
  '/console',
  '/superadmin',
] as const;

/** Guest sign-in under protected prefixes */
const PUBLIC_AUTH_ROUTES = [APP_ROUTES.SUPERADMIN_LOGIN] as const;

const LEGACY_SUPERADMIN_SIGN_IN = ['/superadmin/signin', '/console/sign-in'] as const;

/** Auth-only routes (guest) */
const AUTH_PATH_PREFIXES = [
  '/login',
  APP_ROUTES.SUPERADMIN_LOGIN,
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

function isPublicAuthRoute(pathWithoutLocale: string): boolean {
  return PUBLIC_AUTH_ROUTES.some((route) => pathWithoutLocale === route);
}

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const pathWithoutLocale = stripLocale(pathname);
  const locale = pathname.split('/')[1] ?? 'en';

  const sessionToken = request.cookies.get(MIDDLEWARE_AUTH.REFRESH_COOKIE_NAME)?.value;
  const isAuthenticated = Boolean(sessionToken);
  const roleCookie = request.cookies.get(MIDDLEWARE_AUTH.ROLE_COOKIE_NAME)?.value ?? null;
  const activeRole = await parseRoleCookie(roleCookie);

  if (LEGACY_SUPERADMIN_SIGN_IN.includes(pathWithoutLocale as (typeof LEGACY_SUPERADMIN_SIGN_IN)[number])) {
    return NextResponse.redirect(
      new URL(`/${locale}${APP_ROUTES.SUPERADMIN_LOGIN}`, request.url),
    );
  }

  const isProtected = matchesPrefix(pathWithoutLocale, PROTECTED_PATH_PREFIXES);
  const isAuthRoute = matchesPrefix(pathWithoutLocale, AUTH_PATH_PREFIXES);

  if (isProtected && !isAuthenticated && !isPublicAuthRoute(pathWithoutLocale)) {
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
      // Missing/invalid signed role cookie — send to neutral dashboard so client can re-hydrate
      // without a login ↔ dashboard redirect loop (blank screen on refresh).
      if (pathWithoutLocale !== '/dashboard') {
        return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
      }
    } else if (!isPathAllowedForRole(pathWithoutLocale, activeRole)) {
      const forbiddenUrl = new URL(`/${locale}/forbidden`, request.url);
      forbiddenUrl.searchParams.set('from', pathWithoutLocale);
      return NextResponse.rewrite(forbiddenUrl, { status: 403 });
    }
  }

  const response = intlMiddleware(request);
  response.headers.set('x-pathname', pathname);
  return response;
}

export const config = {
  matcher: ['/', '/(en|hi|te)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
};
