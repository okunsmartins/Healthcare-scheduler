import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, CalendarCheck } from 'lucide-react';
import { SignOutButton } from '@/components/shell/sign-out-button';
import { ThemeToggle } from '@/components/shell/theme-toggle';
import { getMyMemberships } from '@/lib/tenancy';

export const metadata: Metadata = { title: 'Workspaces' };

/**
 * Lists the workspaces the signed-in user belongs to and lets them pick one. With exactly
 * one membership we forward straight into it. With none, we show an empty state (in-app
 * workspace creation arrives in Phase 3 — for now membership is provisioned server-side).
 */
export default async function WorkspacesPage() {
  const memberships = await getMyMemberships();

  const only = memberships.length === 1 ? memberships[0] : undefined;
  if (only) {
    redirect(`/${only.slug}/dashboard`);
  }

  return (
    <div className="min-h-dvh">
      <header className="flex h-14 items-center justify-between border-b bg-card/95 px-4 backdrop-blur sm:px-6">
        <span className="flex items-center gap-2">
          <CalendarCheck className="h-5 w-5 text-primary" aria-hidden />
          <span className="text-sm font-semibold">Healthcare Scheduler</span>
        </span>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <SignOutButton showLabel={false} />
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">Choose a workspace</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Select the workspace you want to work in.
        </p>

        {memberships.length === 0 ? (
          <div className="mt-8 rounded-lg border bg-card p-6 text-card-foreground">
            <p className="font-medium">You’re not a member of any workspace yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ask a workspace owner to invite you. In-app workspace creation is coming
              soon.
            </p>
          </div>
        ) : (
          <ul className="mt-8 space-y-3">
            {memberships.map((m) => (
              <li key={m.tenantId}>
                <Link
                  href={`/${m.slug}/dashboard`}
                  className="flex items-center justify-between gap-3 rounded-lg border bg-card p-4 text-card-foreground transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{m.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {m.roleName}
                    </span>
                  </span>
                  <ArrowRight
                    className="h-5 w-5 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
