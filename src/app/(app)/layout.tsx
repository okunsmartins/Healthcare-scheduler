import { AppShell } from '@/components/shell/app-shell';
import { requireUser } from '@/lib/auth/user';

/**
 * Layout for the authenticated workspace. Middleware already redirects unauthenticated
 * requests to sign-in; `requireUser()` re-checks here as defence-in-depth and provides the
 * user for the shell.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return <AppShell userEmail={user.email ?? ''}>{children}</AppShell>;
}
