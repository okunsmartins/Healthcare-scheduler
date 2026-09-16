import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { AddShiftInstanceForm } from '@/components/shift-instances/add-shift-instance-form';
import { canManageRoster } from '@/lib/shift-instances';
import { getDepartments } from '@/lib/departments';
import { getShiftTypes } from '@/lib/shift-types';
import { resolveTenantContext } from '@/lib/tenancy';

export const metadata: Metadata = { title: 'New shift' };

export default async function NewShiftInstancePage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = await resolveTenantContext(tenantSlug);
  if (!tenant) notFound();
  if (!canManageRoster(tenant.roleKey)) redirect(`/${tenantSlug}/roster`);

  const [departments, shiftTypes] = await Promise.all([
    getDepartments(tenant.id),
    getShiftTypes(tenant.id),
  ]);
  const activeDepartments = departments
    .filter((d) => d.status === 'active')
    .map((d) => ({ id: d.id, name: d.name }));
  const activeShiftTypes = shiftTypes
    .filter((t) => t.status === 'active')
    .map((t) => ({ id: t.id, name: t.name, startTime: t.startTime, endTime: t.endTime }));

  const missing = activeDepartments.length === 0 || activeShiftTypes.length === 0;

  return (
    <div className="max-w-md">
      <Link
        href={`/${tenantSlug}/roster`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to roster
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">Schedule a shift</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Put a shift type on the roster for a department on a given date.
      </p>

      <div className="mt-6 rounded-lg border bg-card p-6 text-card-foreground">
        {missing ? (
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">A little setup first.</p>
            <p className="mt-2">
              You need at least one active{' '}
              <Link
                href={`/${tenantSlug}/settings/departments`}
                className="underline underline-offset-4 hover:text-foreground"
              >
                department
              </Link>{' '}
              and one active{' '}
              <Link
                href={`/${tenantSlug}/settings/shift-types`}
                className="underline underline-offset-4 hover:text-foreground"
              >
                shift type
              </Link>{' '}
              before scheduling a shift.
            </p>
          </div>
        ) : (
          <AddShiftInstanceForm
            tenantSlug={tenantSlug}
            departments={activeDepartments}
            shiftTypes={activeShiftTypes}
          />
        )}
      </div>
    </div>
  );
}
