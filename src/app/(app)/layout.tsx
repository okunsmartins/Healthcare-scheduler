import { requireUser } from '@/lib/auth/user';

/**
 * Guard for every authenticated area (`/workspaces` and `/[tenantSlug]/*`). Middleware
 * already redirects unauthenticated requests; `requireUser()` re-checks here as
 * defence-in-depth. The workspace chrome (sidebar/nav) is added by the `[tenantSlug]`
 * layout, since it needs a resolved tenant — `/workspaces` itself renders chrome-free.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return children;
}
