import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { AddEmployeeForm } from '@/components/employees/add-employee-form';
import { canManageStaff } from '@/lib/employees';
import { resolveTenantContext } from '@/lib/tenancy';

export const metadata: Metadata = { title: 'Add staff' };

export default async function NewEmployeePage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = await resolveTenantContext(tenantSlug);
  if (!tenant) notFound();
  // Guard the page for non-managers; RLS is the authoritative check on the insert itself.
  if (!canManageStaff(tenant.roleKey)) redirect(`/${tenantSlug}/people`);

  return (
    <div className="max-w-md">
      <Link
        href={`/${tenantSlug}/people`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to people
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">Add a staff member</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Add someone to this workspace’s directory. You can refine their details later.
      </p>

      <div className="mt-6 rounded-lg border bg-card p-6 text-card-foreground">
        <AddEmployeeForm tenantSlug={tenantSlug} />
      </div>
    </div>
  );
}
