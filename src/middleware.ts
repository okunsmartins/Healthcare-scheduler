import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import {
  DEFAULT_SIGNED_IN_PATH,
  SIGN_IN_PATH,
  SIGNED_OUT_ONLY_PREFIXES,
  matchesAnyPrefix,
  requiresAuth,
} from '@/lib/auth/routes';

/**
 * On every matched request we refresh the Supabase session, then enforce access:
 *  - unauthenticated users are redirected away from protected app routes to sign-in
 *    (preserving where they were headed via `redirectTo`);
 *  - authenticated users are redirected away from signed-out-only auth pages.
 *
 * Refreshed auth cookies from `updateSession` are copied onto any redirect response so the
 * session is never dropped.
 */
export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (!user && requiresAuth(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = SIGN_IN_PATH;
    url.search = '';
    url.searchParams.set('redirectTo', pathname);
    return copyCookies(response, NextResponse.redirect(url));
  }

  if (user && matchesAnyPrefix(pathname, SIGNED_OUT_ONLY_PREFIXES)) {
    const url = request.nextUrl.clone();
    url.pathname = DEFAULT_SIGNED_IN_PATH;
    url.search = '';
    return copyCookies(response, NextResponse.redirect(url));
  }

  return response;
}

/** Carry refreshed auth cookies from the session response onto a redirect response. */
function copyCookies(from: NextResponse, to: NextResponse): NextResponse {
  from.cookies.getAll().forEach((cookie) => to.cookies.set(cookie));
  return to;
}

export const config = {
  // Run on everything except Next internals and static assets. `/auth/*` and public pages
  // stay in scope so sessions refresh there too.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
