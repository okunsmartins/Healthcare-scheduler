import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Plus } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { resolveTenantContext } from '@/lib/tenancy';
import { canManageStaff, EMPLOYMENT_TYPE_LABEL, getEmployees } from '@/lib/employees';

export const metadata: Metadata = { title: 'People' };

const STATUS_TONE = {
  active: 'safe',
  suspended: 'suspended',
  archived: 'archived',
} as const;

export default async function PeoplePage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = await resolveTenantContext(tenantSlug);
  if (!tenant) notFound();

  const employees = await getEmployees(tenant.id);
  const canManage = canManageStaff(tenant.roleKey);

  return (
    <>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">People</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            The staff in this workspace. Contracts, skills, and availability arrive on
            later branches.
          </p>
        </div>
        {canManage ? (
          <Link
            href={`/${tenantSlug}/people/new`}
            className={cn(buttonVariants(), 'shrink-0')}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add staff
          </Link>
        ) : null}
      </div>

      {employees.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-card p-8 text-card-foreground">
          <p className="text-sm font-medium">No staff yet.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {canManage
              ? 'Add your first staff member to get started.'
              : 'Staff added by a manager will appear here.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Job title</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <span className="font-medium text-foreground">{e.fullName}</span>
                    {e.email ? (
                      <span className="block text-xs text-muted-foreground">
                        {e.email}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{e.jobTitle ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {EMPLOYMENT_TYPE_LABEL[e.employmentType]}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={STATUS_TONE[e.status]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
