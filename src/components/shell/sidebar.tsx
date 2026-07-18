'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarCheck, ChevronsUpDown } from 'lucide-react';
import type { TenantContext } from '@/lib/tenancy';
import { cn } from '@/lib/utils/cn';
import { isNavItemActive, navHref, NAV_ITEMS } from './nav-items';
import { SignOutButton } from './sign-out-button';
import { ThemeToggle } from './theme-toggle';

/**
 * Desktop sidebar (≥ md). Fixed to the left edge; the shell reserves space for it with
 * left padding so it never overlaps content. Hidden on mobile, where MobileNav takes over.
 * Navigation is scoped to the active `tenant`.
 */
export function Sidebar({
  userEmail,
  tenant,
}: {
  userEmail: string;
  tenant: TenantContext;
}) {
  const pathname = usePathname();

  return (
    <aside
      aria-label="Primary"
      className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-card md:flex"
    >
      <Link
        href={`/${tenant.slug}/dashboard`}
        className="flex items-center gap-2 px-6 py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <CalendarCheck className="h-6 w-6 shrink-0 text-primary" aria-hidden />
        <span
          className="truncate text-sm font-semibold leading-tight"
          title={tenant.name}
        >
          {tenant.name}
        </span>
      </Link>

      {/* Switch workspace */}
      <Link
        href="/workspaces"
        className="mx-3 mb-2 flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-accent/60 hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="truncate">Switch workspace</span>
        <ChevronsUpDown className="h-4 w-4 shrink-0" aria-hidden />
      </Link>

      <nav aria-label="Primary" className="flex-1 px-3 py-2">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isNavItemActive(pathname, tenant.slug, item.segment);
            const Icon = item.icon;
            return (
              <li key={item.segment}>
                <Link
                  href={navHref(tenant.slug, item.segment)}
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

      <div className="space-y-2 border-t px-3 py-3">
        {userEmail ? (
          <p className="truncate px-1 text-xs text-muted-foreground" title={userEmail}>
            {userEmail}
          </p>
        ) : null}
        <div className="flex items-center justify-between">
          <SignOutButton />
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
