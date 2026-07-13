import { describe, expect, it } from 'vitest';
import { isTheme, oppositeTheme, resolveInitialTheme } from './theme';

describe('isTheme', () => {
  it('accepts the two valid themes', () => {
    expect(isTheme('light')).toBe(true);
    expect(isTheme('dark')).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isTheme('system')).toBe(false);
    expect(isTheme('')).toBe(false);
    expect(isTheme(null)).toBe(false);
    expect(isTheme(undefined)).toBe(false);
  });
});

describe('resolveInitialTheme', () => {
  it('honours an explicit stored choice over the system preference', () => {
    expect(resolveInitialTheme('light', true)).toBe('light');
    expect(resolveInitialTheme('dark', false)).toBe('dark');
  });

  it('falls back to the system preference when there is no valid stored choice', () => {
    expect(resolveInitialTheme(null, true)).toBe('dark');
    expect(resolveInitialTheme(null, false)).toBe('light');
    expect(resolveInitialTheme('not-a-theme', true)).toBe('dark');
  });
});

describe('oppositeTheme', () => {
  it('flips between light and dark', () => {
    expect(oppositeTheme('light')).toBe('dark');
    expect(oppositeTheme('dark')).toBe('light');
  });
});
