import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { routing } from '@/lib/i18n/routing';

/**
 * Edge middleware — i18n routing + auth gate via learnova_session cookie.
 */

const intlMiddleware = createMiddleware(routing);

/** Routes that require an authenticated session */
const PROTECTED_PATH_PREFIXES = [
  '/dashboard',
  '/sessions',
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

  const sessionToken = request.cookies.get('learnova_session')?.value;
  const isAuthenticated = Boolean(sessionToken);

  const isProtected = matchesPrefix(pathWithoutLocale, PROTECTED_PATH_PREFIXES);
  const isAuthRoute = matchesPrefix(pathWithoutLocale, AUTH_PATH_PREFIXES);

  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set('next', pathWithoutLocale);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL(`/${locale}/sessions`, request.url));
  }

  const response = intlMiddleware(request);
  response.headers.set('x-pathname', pathname);
  return response;
}

export const config = {
  matcher: ['/', '/(en|hi|te)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
};
