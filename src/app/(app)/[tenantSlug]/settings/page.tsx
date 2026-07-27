import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Building2, ChevronRight } from 'lucide-react';
import { PageHeader, ComingSoon } from '@/components/shell/page-header';
import { resolveTenantContext } from '@/lib/tenancy';
import { canManageDepartments } from '@/lib/departments';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = await resolveTenantContext(tenantSlug);
  if (!tenant) notFound();

  const canManageDepts = canManageDepartments(tenant.roleKey);

  return (
    <>
      <PageHeader
        title="Settings"
        description="Workspace configuration, departments, roles, and permissions."
      />

      {canManageDepts ? (
        <div className="rounded-lg border bg-card text-card-foreground">
          <Link
            href={`/${tenantSlug}/settings/departments`}
            className="flex items-center gap-4 p-5 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-background">
              <Building2 className="h-5 w-5 text-muted-foreground" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-medium">Departments</span>
              <span className="block text-sm text-muted-foreground">
                Create and manage the departments in this workspace.
              </span>
            </span>
            <ChevronRight
              className="h-5 w-5 shrink-0 text-muted-foreground"
              aria-hidden
            />
          </Link>
        </div>
      ) : (
        <ComingSoon branch="feature/department-management" />
      )}

      <p className="mt-6 text-sm text-muted-foreground">
        Roles, permissions, and workspace preferences arrive on later branches.
      </p>
    </>
  );
}
