import { AppShell } from '@/components/shell/app-shell';

/**
 * Layout for the authenticated workspace. Route protection is added on
 * `feature/supabase-authentication`; today the shell is publicly reachable so it can be
 * previewed and reviewed.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
