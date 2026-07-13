import { THEME_STORAGE_KEY } from '@/lib/theme/theme';

/**
 * Blocking inline script that applies the resolved theme to <html> before first paint,
 * preventing a light/dark flash on load. It mirrors `resolveInitialTheme`, but is inlined
 * as a string because it must run before React hydrates. Keep the two in sync.
 */
const script = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var s=localStorage.getItem(k);var d=s==='dark'||(s!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
