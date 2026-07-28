import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { DepartmentAccessForm } from '@/components/departments/department-access-form';
import {
  canManageDepartments,
  getDepartment,
  getDepartmentAccess,
} from '@/lib/departments';
import { resolveTenantContext } from '@/lib/tenancy';

export const metadata: Metadata = { title: 'Department access' };

export default async function DepartmentMembersPage({
  params,
}: {
  params: Promise<{ tenantSlug: string; departmentId: string }>;
}) {
  const { tenantSlug, departmentId } = await params;
  const tenant = await resolveTenantContext(tenantSlug);
  if (!tenant) notFound();
  // Guard for non-managers; RLS is the authoritative check on every write.
  if (!canManageDepartments(tenant.roleKey)) redirect(`/${tenantSlug}/settings`);

  const department = await getDepartment(tenant.id, departmentId);
  if (!department) notFound();

  const members = await getDepartmentAccess(tenant.id, departmentId);

  return (
    <div className="max-w-lg">
      <Link
        href={`/${tenantSlug}/settings/departments`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to departments
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">{department.name} access</h1>
      <p className="mt-1 max-w-prose text-sm text-muted-foreground">
        Choose which members are scoped to this department. A member scoped to one or more
        departments sees only those; a member scoped to none sees every department in the
        workspace.
      </p>

      <div className="mt-6">
        {members.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-card p-8 text-card-foreground">
            <p className="text-sm font-medium">No members yet.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Invite members to the workspace before scoping department access.
            </p>
          </div>
        ) : (
          <DepartmentAccessForm
            tenantSlug={tenantSlug}
            departmentId={departmentId}
            members={members}
          />
        )}
      </div>
    </div>
  );
}
