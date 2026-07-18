import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SIGNED_IN_PATH,
  isPublicPath,
  matchesPrefix,
  requiresAuth,
  safeRedirectPath,
  SIGNED_OUT_ONLY_PREFIXES,
  matchesAnyPrefix,
} from './routes';

describe('matchesPrefix', () => {
  it('matches the exact path and descendants, not string-prefix siblings', () => {
    expect(matchesPrefix('/roster', '/roster')).toBe(true);
    expect(matchesPrefix('/roster/2026-07', '/roster')).toBe(true);
    expect(matchesPrefix('/rostering', '/roster')).toBe(false);
  });
});

describe('isPublicPath / requiresAuth', () => {
  it('treats the landing page and auth/api routes as public', () => {
    expect(isPublicPath('/')).toBe(true);
    expect(isPublicPath('/sign-in')).toBe(true);
    expect(isPublicPath('/auth/confirm')).toBe(true);
    expect(isPublicPath('/api/health')).toBe(true);
  });

  it('requires auth for workspaces and every tenant-scoped route', () => {
    expect(requiresAuth('/workspaces')).toBe(true);
    expect(requiresAuth('/st-marys/dashboard')).toBe(true);
    expect(requiresAuth('/st-marys/roster/2026-07')).toBe(true);
  });

  it('does not treat the landing page as auth-required', () => {
    expect(requiresAuth('/')).toBe(false);
  });
});

describe('matchesAnyPrefix (signed-out-only routes)', () => {
  it('bounces signed-in users off sign-in/up/reset', () => {
    expect(matchesAnyPrefix('/sign-in', SIGNED_OUT_ONLY_PREFIXES)).toBe(true);
    expect(matchesAnyPrefix('/reset-password', SIGNED_OUT_ONLY_PREFIXES)).toBe(true);
    expect(matchesAnyPrefix('/workspaces', SIGNED_OUT_ONLY_PREFIXES)).toBe(false);
  });
});

describe('safeRedirectPath', () => {
  it('allows in-app absolute paths', () => {
    expect(safeRedirectPath('/st-marys/roster')).toBe('/st-marys/roster');
    expect(safeRedirectPath('/workspaces')).toBe('/workspaces');
  });

  it('falls back for empty, external, or protocol-relative targets', () => {
    expect(safeRedirectPath(null)).toBe(DEFAULT_SIGNED_IN_PATH);
    expect(safeRedirectPath(undefined)).toBe(DEFAULT_SIGNED_IN_PATH);
    expect(safeRedirectPath('https://evil.example')).toBe(DEFAULT_SIGNED_IN_PATH);
    expect(safeRedirectPath('//evil.example')).toBe(DEFAULT_SIGNED_IN_PATH);
    expect(safeRedirectPath('not-a-path')).toBe(DEFAULT_SIGNED_IN_PATH);
  });

  it('honours a custom fallback', () => {
    expect(safeRedirectPath(null, '/st-marys/roster')).toBe('/st-marys/roster');
  });
});
