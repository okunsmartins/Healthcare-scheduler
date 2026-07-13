import type { Metadata } from 'next';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { getUser } from '@/lib/auth/user';

export const metadata: Metadata = {
  title: 'Welcome',
};

const PRINCIPLES = [
  {
    title: 'Tenant isolation by design',
    body: 'Every organisation works inside a fully isolated workspace, enforced at the database layer with row-level security — not just in the UI.',
  },
  {
    title: 'Explainable scheduling',
    body: 'A deterministic rules engine shows exactly why a shift is safe, at risk, or blocked. No opaque automatic assignment.',
  },
  {
    title: 'Accessibility by design',
    body: 'WCAG 2.2 AA target: full keyboard support, visible focus, and status that never depends on colour alone.',
  },
];

export default async function HomePage() {
  const user = await getUser();

  return (
    <main id="main-content" className="mx-auto max-w-4xl px-6 py-16 sm:py-24">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">
          MVP · Synthetic data only
        </span>
        <StatusBadge status="draft" />
      </div>

      <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
        Healthcare Scheduler Portal
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
        A secure, multi-tenant platform for healthcare workforce scheduling. Hospitals,
        clinics, and care groups manage their own staff rosters inside isolated workspaces
        — built security-, privacy-, and accessibility-first for the Ireland and EU
        market.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        {user ? (
          <Link href="/dashboard" className={buttonVariants({ size: 'lg' })}>
            Go to your workspace
          </Link>
        ) : (
          <>
            <Link href="/sign-in" className={buttonVariants({ size: 'lg' })}>
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className={buttonVariants({ size: 'lg', variant: 'outline' })}
            >
              Create an account
            </Link>
          </>
        )}
      </div>

      <section aria-labelledby="principles-heading" className="mt-16">
        <h2 id="principles-heading" className="text-xl font-semibold">
          Built on clear principles
        </h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-3">
          {PRINCIPLES.map((p) => (
            <li
              key={p.title}
              className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm"
            >
              <h3 className="font-semibold">{p.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{p.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <footer className="mt-16 border-t pt-6 text-sm text-muted-foreground">
        <p>
          This demonstration MVP is not GDPR-certified, HSE-approved, clinically
          certified, or production-ready for real healthcare data. It uses synthetic data
          only and is not a substitute for independent security, legal, clinical, or
          data-protection review.
        </p>
      </footer>
    </main>
  );
}
