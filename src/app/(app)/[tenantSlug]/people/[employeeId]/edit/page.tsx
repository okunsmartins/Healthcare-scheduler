import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { EditEmployeeForm } from '@/components/employees/edit-employee-form';
import { canManageStaff, getEmployee } from '@/lib/employees';
import { resolveTenantContext } from '@/lib/tenancy';

export const metadata: Metadata = { title: 'Edit staff' };

export default async function EditEmployeePage({
  params,
}: {
  params: Promise<{ tenantSlug: string; employeeId: string }>;
}) {
  const { tenantSlug, employeeId } = await params;
  const tenant = await resolveTenantContext(tenantSlug);
  if (!tenant) notFound();
  // Guard the page for non-managers; RLS is the authoritative check on the update itself.
  if (!canManageStaff(tenant.roleKey)) redirect(`/${tenantSlug}/people`);

  const employee = await getEmployee(tenant.id, employeeId);
  if (!employee) notFound();

  return (
    <div className="max-w-md">
      <Link
        href={`/${tenantSlug}/people`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to people
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">Edit staff member</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Update {employee.fullName}’s details, or archive them to remove them from active
        use.
      </p>

      <div className="mt-6 rounded-lg border bg-card p-6 text-card-foreground">
        <EditEmployeeForm tenantSlug={tenantSlug} employee={employee} />
      </div>
    </div>
  );
}
