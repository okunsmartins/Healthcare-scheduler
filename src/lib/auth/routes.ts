/** Where to send a user after a successful sign-in when no explicit target is given. */
export const DEFAULT_SIGNED_IN_PATH = '/dashboard';

/** The sign-in route. */
export const SIGN_IN_PATH = '/sign-in';

/**
 * Route sections that require an authenticated user. These mirror the `(app)` route group
 * — kept as an explicit list so middleware does not depend on route-group internals.
 */
export const PROTECTED_PREFIXES = [
  '/dashboard',
  '/roster',
  '/people',
  '/settings',
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
