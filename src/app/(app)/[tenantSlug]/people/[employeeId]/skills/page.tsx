import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { EmployeeSkillsForm } from '@/components/skills/employee-skills-form';
import { resolveTenantContext } from '@/lib/tenancy';
import { canManageStaff, getEmployee } from '@/lib/employees';
import { getSkillAssignment } from '@/lib/skills';

export const metadata: Metadata = { title: 'Manage skills' };

export default async function ManageEmployeeSkillsPage({
  params,
}: {
  params: Promise<{ tenantSlug: string; employeeId: string }>;
}) {
  const { tenantSlug, employeeId } = await params;
  const tenant = await resolveTenantContext(tenantSlug);
  if (!tenant) notFound();
  // Guard for non-managers; RLS is the authoritative check on every write.
  if (!canManageStaff(tenant.roleKey)) redirect(`/${tenantSlug}/people/${employeeId}`);

  const employee = await getEmployee(tenant.id, employeeId);
  if (!employee) notFound();

  const options = await getSkillAssignment(tenant.id, employeeId);

  return (
    <div className="max-w-lg">
      <Link
        href={`/${tenantSlug}/people/${employeeId}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to {employee.fullName}
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">Manage skills</h1>
      <p className="mt-1 max-w-prose text-sm text-muted-foreground">
        Choose the skills {employee.fullName} holds. Only active skills from the catalog
        can be assigned — add more under Settings → Skills.
      </p>

      <div className="mt-6">
        {options.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-card p-8 text-card-foreground">
            <p className="text-sm font-medium">No active skills in the catalog.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Create skills under{' '}
              <Link
                href={`/${tenantSlug}/settings/skills`}
                className="underline underline-offset-4 hover:text-foreground"
              >
                Settings → Skills
              </Link>{' '}
              before assigning them.
            </p>
          </div>
        ) : (
          <EmployeeSkillsForm
            tenantSlug={tenantSlug}
            employeeId={employeeId}
            options={options}
          />
        )}
      </div>
    </div>
  );
}
