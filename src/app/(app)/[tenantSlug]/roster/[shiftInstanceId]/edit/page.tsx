import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { EditShiftInstanceForm } from '@/components/shift-instances/edit-shift-instance-form';
import {
  canManageRoster,
  formatShiftDate,
  getShiftInstance,
} from '@/lib/shift-instances';
import type {
  DepartmentOption,
  ShiftTypeOption,
} from '@/components/shift-instances/shift-instance-fields';
import { getDepartments } from '@/lib/departments';
import { getShiftTypes } from '@/lib/shift-types';
import { resolveTenantContext } from '@/lib/tenancy';

export const metadata: Metadata = { title: 'Edit shift' };

export default async function EditShiftInstancePage({
  params,
}: {
  params: Promise<{ tenantSlug: string; shiftInstanceId: string }>;
}) {
  const { tenantSlug, shiftInstanceId } = await params;
  const tenant = await resolveTenantContext(tenantSlug);
  if (!tenant) notFound();
  if (!canManageRoster(tenant.roleKey)) redirect(`/${tenantSlug}/roster`);

  const shiftInstance = await getShiftInstance(tenant.id, shiftInstanceId);
  if (!shiftInstance) notFound();

  const [departments, shiftTypes] = await Promise.all([
    getDepartments(tenant.id),
    getShiftTypes(tenant.id),
  ]);

  // Active options, plus the shift's current department/type even if archived, so the current
  // selection stays visible in the dropdowns.
  const departmentOptions: DepartmentOption[] = departments
    .filter((d) => d.status === 'active' || d.id === shiftInstance.department.id)
    .map((d) => ({ id: d.id, name: d.name }));
  const shiftTypeOptions: ShiftTypeOption[] = shiftTypes
    .filter((t) => t.status === 'active' || t.id === shiftInstance.shiftType.id)
    .map((t) => ({ id: t.id, name: t.name, startTime: t.startTime, endTime: t.endTime }));

  return (
    <div className="max-w-md">
      <Link
        href={`/${tenantSlug}/roster`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to roster
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">Edit shift</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {shiftInstance.shiftType.name} · {formatShiftDate(shiftInstance.date)} ·{' '}
        {shiftInstance.department.name}
      </p>

      <div className="mt-6 rounded-lg border bg-card p-6 text-card-foreground">
        <EditShiftInstanceForm
          tenantSlug={tenantSlug}
          shiftInstance={shiftInstance}
          departments={departmentOptions}
          shiftTypes={shiftTypeOptions}
        />
      </div>
    </div>
  );
}
