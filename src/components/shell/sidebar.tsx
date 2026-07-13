'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarCheck } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { isNavItemActive, NAV_ITEMS } from './nav-items';
import { ThemeToggle } from './theme-toggle';

/**
 * Desktop sidebar (≥ md). Fixed to the left edge; the shell reserves space for it with
 * left padding so it never overlaps content. Hidden on mobile, where MobileNav takes over.
 */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      aria-label="Primary"
      className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-card md:flex"
    >
      <Link
        href="/dashboard"
        className="flex items-center gap-2 px-6 py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <CalendarCheck className="h-6 w-6 text-primary" aria-hidden />
        <span className="text-sm font-semibold leading-tight">
          Healthcare
          <br />
          Scheduler
        </span>
      </Link>

      <nav aria-label="Primary" className="flex-1 px-3 py-2">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isNavItemActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                    active
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent/60 hover:text-accent-foreground',
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="flex items-center justify-between border-t px-4 py-3">
        <span className="text-xs text-muted-foreground">MVP · Synthetic data</span>
        <ThemeToggle />
      </div>
    </aside>
  );
}
