import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Pencil, Plus } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { resolveTenantContext } from '@/lib/tenancy';
import { canManageStaff, EMPLOYMENT_TYPE_LABEL, getEmployee } from '@/lib/employees';
import { getEmployeeSkills } from '@/lib/skills';

export const metadata: Metadata = { title: 'Staff member' };

const STATUS_TONE = {
  active: 'safe',
  suspended: 'suspended',
  archived: 'archived',
} as const;

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-foreground">{value}</dd>
    </div>
  );
}

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ tenantSlug: string; employeeId: string }>;
}) {
  const { tenantSlug, employeeId } = await params;
  const tenant = await resolveTenantContext(tenantSlug);
  if (!tenant) notFound();

  const employee = await getEmployee(tenant.id, employeeId);
  if (!employee) notFound();

  const skills = await getEmployeeSkills(tenant.id, employeeId);
  const canManage = canManageStaff(tenant.roleKey);

  return (
    <div className="max-w-2xl">
      <Link
        href={`/${tenantSlug}/people`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to people
      </Link>

      <div className="mb-8 mt-4 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {employee.fullName}
          </h1>
          <StatusBadge status={STATUS_TONE[employee.status]} />
        </div>
        {canManage ? (
          <Link
            href={`/${tenantSlug}/people/${employee.id}/edit`}
            className={cn(buttonVariants({ variant: 'outline' }), 'shrink-0')}
          >
            <Pencil className="h-4 w-4" aria-hidden />
            Edit
          </Link>
        ) : null}
      </div>

      <dl className="grid grid-cols-2 gap-4 rounded-lg border bg-card p-6 text-card-foreground sm:grid-cols-3">
        <Detail label="Job title" value={employee.jobTitle ?? '—'} />
        <Detail label="Type" value={EMPLOYMENT_TYPE_LABEL[employee.employmentType]} />
        <Detail label="Email" value={employee.email ?? '—'} />
      </dl>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Skills</h2>
          {canManage ? (
            <Link
              href={`/${tenantSlug}/people/${employee.id}/skills`}
              className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
            >
              <Plus className="h-4 w-4" aria-hidden />
              Manage skills
            </Link>
          ) : null}
        </div>

        {skills.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-card p-6 text-card-foreground">
            <p className="text-sm text-muted-foreground">
              {canManage
                ? 'No skills yet. Use “Manage skills” to record what this staff member can do.'
                : 'No skills recorded yet.'}
            </p>
          </div>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <li
                key={s.id}
                className="rounded-full border bg-muted px-3 py-1 text-sm text-foreground"
              >
                {s.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
