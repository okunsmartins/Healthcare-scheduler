import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, CalendarCheck } from 'lucide-react';
import { CreateWorkspaceForm } from '@/components/workspaces/create-workspace-form';
import { SignOutButton } from '@/components/shell/sign-out-button';
import { ThemeToggle } from '@/components/shell/theme-toggle';

export const metadata: Metadata = { title: 'Create workspace' };

/**
 * Self-serve workspace creation. Auth is enforced by the `(app)` layout; the actual creation
 * runs server-side via the `create_tenant` DB function (see `createWorkspaceAction`), which
 * makes the caller the owner and routes them into the new workspace.
 */
export default function NewWorkspacePage() {
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

      <main id="main-content" className="mx-auto max-w-md px-4 py-10 sm:px-6">
        <Link
          href="/workspaces"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to workspaces
        </Link>

        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Create a workspace</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Set up a private space for your organisation’s schedules.
        </p>

        <div className="mt-8 rounded-lg border bg-card p-6 text-card-foreground">
          <CreateWorkspaceForm />
        </div>
      </main>
    </div>
  );
}
