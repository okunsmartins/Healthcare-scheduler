import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { ShiftAssignmentForm } from '@/components/shift-assignments/shift-assignment-form';
import { canAssignStaff, getShiftAssignmentOptions } from '@/lib/shift-assignments';
import { formatShiftDate, getShiftInstance } from '@/lib/shift-instances';
import { resolveTenantContext } from '@/lib/tenancy';

export const metadata: Metadata = { title: 'Assign staff' };

export default async function AssignStaffPage({
  params,
}: {
  params: Promise<{ tenantSlug: string; shiftInstanceId: string }>;
}) {
  const { tenantSlug, shiftInstanceId } = await params;
  const tenant = await resolveTenantContext(tenantSlug);
  if (!tenant) notFound();
  if (!canAssignStaff(tenant.roleKey)) redirect(`/${tenantSlug}/roster`);

  const shift = await getShiftInstance(tenant.id, shiftInstanceId);
  if (!shift) notFound();

  const staff = await getShiftAssignmentOptions(tenant.id, shiftInstanceId);
  const booked = staff.filter((s) => s.assigned).length;

  return (
    <div className="max-w-lg">
      <Link
        href={`/${tenantSlug}/roster`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to roster
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">Assign staff</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {shift.shiftType.name} ({shift.shiftType.startTime}–{shift.shiftType.endTime}) ·{' '}
        {formatShiftDate(shift.date)} · {shift.department.name}
      </p>
      <p className="mt-1 text-sm font-medium">
        {booked} of {shift.requiredStaff} booked
        {booked < shift.requiredStaff ? (
          <span className="ml-1 font-normal text-warning">
            · {shift.requiredStaff - booked} still needed
          </span>
        ) : (
          <span className="ml-1 font-normal text-safe">· fully staffed</span>
        )}
      </p>

      <div className="mt-6">
        {staff.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-card p-8 text-card-foreground">
            <p className="text-sm font-medium">No active staff.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Add staff under{' '}
              <Link
                href={`/${tenantSlug}/people`}
                className="underline underline-offset-4 hover:text-foreground"
              >
                People
              </Link>{' '}
              before booking them onto shifts.
            </p>
          </div>
        ) : (
          <ShiftAssignmentForm
            tenantSlug={tenantSlug}
            shiftInstanceId={shiftInstanceId}
            staff={staff}
          />
        )}
      </div>
    </div>
  );
}
