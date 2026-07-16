import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SIGNED_IN_PATH,
  matchesAnyPrefix,
  matchesPrefix,
  PROTECTED_PREFIXES,
  safeRedirectPath,
} from './routes';

describe('matchesPrefix', () => {
  it('matches the exact path and descendants, not string-prefix siblings', () => {
    expect(matchesPrefix('/roster', '/roster')).toBe(true);
    expect(matchesPrefix('/roster/2026-07', '/roster')).toBe(true);
    expect(matchesPrefix('/rostering', '/roster')).toBe(false);
  });
});

describe('matchesAnyPrefix', () => {
  it('is true for any protected section', () => {
    expect(matchesAnyPrefix('/dashboard', PROTECTED_PREFIXES)).toBe(true);
    expect(matchesAnyPrefix('/settings/team', PROTECTED_PREFIXES)).toBe(true);
    expect(matchesAnyPrefix('/sign-in', PROTECTED_PREFIXES)).toBe(false);
  });
});

describe('safeRedirectPath', () => {
  it('allows in-app absolute paths', () => {
    expect(safeRedirectPath('/roster')).toBe('/roster');
    expect(safeRedirectPath('/settings/team')).toBe('/settings/team');
  });

  it('falls back for empty, external, or protocol-relative targets', () => {
    expect(safeRedirectPath(null)).toBe(DEFAULT_SIGNED_IN_PATH);
    expect(safeRedirectPath(undefined)).toBe(DEFAULT_SIGNED_IN_PATH);
    expect(safeRedirectPath('https://evil.example')).toBe(DEFAULT_SIGNED_IN_PATH);
    expect(safeRedirectPath('//evil.example')).toBe(DEFAULT_SIGNED_IN_PATH);
    expect(safeRedirectPath('not-a-path')).toBe(DEFAULT_SIGNED_IN_PATH);
  });

  it('honours a custom fallback', () => {
    expect(safeRedirectPath(null, '/roster')).toBe('/roster');
  });
});
