/** Where to send a user after a successful sign-in when no explicit target is given. */
export const DEFAULT_SIGNED_IN_PATH = '/workspaces';

/** The sign-in route. */
export const SIGN_IN_PATH = '/sign-in';

/**
 * Paths that never require authentication. Everything else under the app (including
 * `/workspaces` and every `/[tenantSlug]/*` route) requires a signed-in user. We allowlist
 * public paths rather than enumerate protected ones, because tenant slugs are dynamic.
 */
export const PUBLIC_EXACT_PATHS = ['/'] as const;
export const PUBLIC_PREFIXES = [
  '/sign-in',
  '/sign-up',
  '/reset-password',
  '/update-password',
  '/auth',
  '/api',
] as const;

/**
 * Auth routes that only make sense when signed out. A signed-in user hitting these is
 * bounced to the app.
 */
export const SIGNED_OUT_ONLY_PREFIXES = [
  '/sign-in',
  '/sign-up',
  '/reset-password',
] as const;

/** True when `pathname` is exactly `prefix` or a descendant route of it. */
export function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** True when `pathname` falls under any of the given prefixes. */
export function matchesAnyPrefix(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) => matchesPrefix(pathname, prefix));
}

/** True when a path is publicly accessible (no session required). */
export function isPublicPath(pathname: string): boolean {
  return (
    (PUBLIC_EXACT_PATHS as readonly string[]).includes(pathname) ||
    matchesAnyPrefix(pathname, PUBLIC_PREFIXES)
  );
}

/** True when a path requires an authenticated user. */
export function requiresAuth(pathname: string): boolean {
  return !isPublicPath(pathname);
}

/**
 * Restrict post-auth redirects to safe, in-app absolute paths. Prevents open-redirects
 * through a crafted `redirectTo` (external URLs, protocol-relative `//host`, or anything
 * not starting with a single `/`).
 */
export function safeRedirectPath(
  target: string | null | undefined,
  fallback: string = DEFAULT_SIGNED_IN_PATH,
): string {
  if (!target) return fallback;
  if (!target.startsWith('/') || target.startsWith('//')) return fallback;
  return target;
}
