'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { THEME_STORAGE_KEY, type Theme } from '@/lib/theme/theme';

function currentTheme(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

/**
 * Toggles between light and dark, persisting the explicit choice. The applied theme lives
 * on <html> (set pre-hydration by ThemeScript), so this reads/writes that class directly
 * rather than owning theme state.
 *
 * `theme` starts as `null` and is only resolved after mount; until then no `aria-pressed`
 * is emitted, which keeps server and client markup identical and avoids a hydration
 * mismatch. The Sun/Moon icons are swapped purely with CSS `dark:` variants for the same
 * reason.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = React.useState<Theme | null>(null);

  React.useEffect(() => {
    setTheme(currentTheme());
  }, []);

  function toggle() {
    const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', next === 'dark');
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Private-mode / storage-disabled: the choice simply won't persist.
    }
    setTheme(next);
  }

  const label =
    theme === 'dark'
      ? 'Switch to light theme'
      : theme === 'light'
        ? 'Switch to dark theme'
        : 'Toggle theme';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      aria-pressed={theme === null ? undefined : theme === 'dark'}
      title={label}
      className={cn(
        'inline-flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground',
        'transition-colors hover:bg-accent hover:text-accent-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className,
      )}
    >
      <Sun className="h-5 w-5 dark:hidden" aria-hidden />
      <Moon className="hidden h-5 w-5 dark:block" aria-hidden />
    </button>
  );
}
