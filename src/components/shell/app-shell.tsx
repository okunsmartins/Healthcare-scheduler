import Link from 'next/link';
import { CalendarCheck } from 'lucide-react';
import { MobileNav } from './mobile-nav';
import { Sidebar } from './sidebar';
import { ThemeToggle } from './theme-toggle';

/**
 * Authenticated workspace chrome: a fixed desktop sidebar (≥ md) or a mobile top bar plus
 * bottom nav (< md), wrapping the routed page content. `<main>` carries `#main-content` so
 * the root layout's skip link lands here.
 *
 * This is presentational scaffolding only — auth and real workspace context arrive on
 * later feature branches (see docs/IMPLEMENTATION_PLAN.md).
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh md:pl-64">
      <Sidebar />

      {/* Mobile top bar: the sidebar is hidden < md, so brand + theme toggle live here. */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-card/95 px-4 backdrop-blur md:hidden">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <CalendarCheck className="h-5 w-5 text-primary" aria-hidden />
          <span className="text-sm font-semibold">Healthcare Scheduler</span>
        </Link>
        <ThemeToggle />
      </header>

      <main id="main-content" className="px-4 pb-24 pt-6 sm:px-6 md:pb-10 md:pt-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>

      <MobileNav />
    </div>
  );
}
