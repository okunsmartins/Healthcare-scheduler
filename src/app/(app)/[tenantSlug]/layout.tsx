import { notFound } from 'next/navigation';
import { AppShell } from '@/components/shell/app-shell';
import { requireUser } from '@/lib/auth/user';
import { resolveTenantContext } from '@/lib/tenancy';

/**
 * Tenant-scoped layout. Resolves the `[tenantSlug]` segment to a tenant the signed-in user
 * actually belongs to — a candidate slug is only trusted after this membership check. A
 * non-member (or unknown slug) gets a 404, which does not reveal which case it is; RLS
 * enforces the same boundary at the database. On success it renders the workspace shell.
 */
export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenantSlug: string }>;
}) {
  const user = await requireUser();
  const { tenantSlug } = await params;

  const tenant = await resolveTenantContext(tenantSlug);
  if (!tenant) notFound();

  return (
    <AppShell userEmail={user.email ?? ''} tenant={tenant}>
      {children}
    </AppShell>
  );
}
