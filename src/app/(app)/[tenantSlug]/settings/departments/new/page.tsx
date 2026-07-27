import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { AddDepartmentForm } from '@/components/departments/add-department-form';
import { canManageDepartments } from '@/lib/departments';
import { resolveTenantContext } from '@/lib/tenancy';

export const metadata: Metadata = { title: 'New department' };

export default async function NewDepartmentPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = await resolveTenantContext(tenantSlug);
  if (!tenant) notFound();
  // Guard for non-managers; RLS is the authoritative check on the insert itself.
  if (!canManageDepartments(tenant.roleKey)) redirect(`/${tenantSlug}/settings`);

  return (
    <div className="max-w-md">
      <Link
        href={`/${tenantSlug}/settings/departments`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to departments
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">New department</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Add a department to this workspace. You can rename or archive it later.
      </p>

      <div className="mt-6 rounded-lg border bg-card p-6 text-card-foreground">
        <AddDepartmentForm tenantSlug={tenantSlug} />
      </div>
    </div>
  );
}
