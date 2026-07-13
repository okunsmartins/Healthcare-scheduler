/**
 * Theme tokens are defined in globals.css for both light and `.dark`. This module holds
 * the small, pure helpers that decide which theme to apply — kept framework-free so they
 * can be unit-tested and reused by the no-FOUC inline script and the client toggle.
 */

export type Theme = 'light' | 'dark';

/** localStorage key holding the user's explicit theme choice, when they have made one. */
export const THEME_STORAGE_KEY = 'hsp-theme';

export function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark';
}

/**
 * Resolve the theme to apply on load. An explicit stored choice always wins; otherwise
 * we follow the operating-system preference.
 */
export function resolveInitialTheme(stored: string | null, prefersDark: boolean): Theme {
  if (isTheme(stored)) return stored;
  return prefersDark ? 'dark' : 'light';
}

/** The opposite theme — used by the toggle. */
export function oppositeTheme(theme: Theme): Theme {
  return theme === 'dark' ? 'light' : 'dark';
}
