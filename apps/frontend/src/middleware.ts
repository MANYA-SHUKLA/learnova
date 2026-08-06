import createMiddleware from 'next-intl/middleware';
import type { NextRequest, NextResponse } from 'next/server';
import { routing } from '@/lib/i18n/routing';

/**
 * Edge middleware — i18n routing + auth gate scaffolding.
 *
 * Auth is PREPARED only:
 * - Session cookie presence check is stubbed
 * - Protected route matcher is ready
 * - Role-based redirects will be wired when auth is implemented
 *
 * DO NOT implement login here.
 */

const intlMiddleware = createMiddleware(routing);

/** Routes that require an authenticated session (prepared) */
const PROTECTED_PATH_PREFIXES = [
  '/dashboard',
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

/** Auth-only routes (guest) — prepared */
const AUTH_PATH_PREFIXES = ['/login', '/register', '/forgot-password'] as const;

function stripLocale(pathname: string): string {
  const segments = pathname.split('/');
  // pathname: /en/dashboard → remove locale segment
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

export default function middleware(request: NextRequest): NextResponse {
  const pathname = request.nextUrl.pathname;
  const pathWithoutLocale = stripLocale(pathname);

  // Prepared: session token lookup (not validated until auth is implemented)
  const sessionToken = request.cookies.get('learnova_session')?.value;
  const isAuthenticated = Boolean(sessionToken);

  const isProtected = matchesPrefix(pathWithoutLocale, PROTECTED_PATH_PREFIXES);
  const isAuthRoute = matchesPrefix(pathWithoutLocale, AUTH_PATH_PREFIXES);

  // Soft gate — when auth ships, uncomment redirect logic
  if (isProtected && !isAuthenticated) {
    // Foundation only: allow through until auth is implemented
    // const locale = pathname.split('/')[1] ?? 'en';
    // return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  if (isAuthRoute && isAuthenticated) {
    // Foundation only: allow through until auth is implemented
    // const locale = pathname.split('/')[1] ?? 'en';
    // return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
  }

  const response = intlMiddleware(request);
  response.headers.set('x-pathname', pathname);
  return response;
}

export const config = {
  matcher: ['/', '/(en|hi|te)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
};
