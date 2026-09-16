import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { EditShiftTypeForm } from '@/components/shift-types/edit-shift-type-form';
import { canManageShiftTypes, getShiftType } from '@/lib/shift-types';
import { resolveTenantContext } from '@/lib/tenancy';

export const metadata: Metadata = { title: 'Edit shift type' };

export default async function EditShiftTypePage({
  params,
}: {
  params: Promise<{ tenantSlug: string; shiftTypeId: string }>;
}) {
  const { tenantSlug, shiftTypeId } = await params;
  const tenant = await resolveTenantContext(tenantSlug);
  if (!tenant) notFound();
  // Guard for non-managers; RLS is the authoritative check on the update itself.
  if (!canManageShiftTypes(tenant.roleKey)) redirect(`/${tenantSlug}/settings`);

  const shiftType = await getShiftType(tenant.id, shiftTypeId);
  if (!shiftType) notFound();

  return (
    <div className="max-w-md">
      <Link
        href={`/${tenantSlug}/settings/shift-types`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to shift types
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">Edit shift type</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Update {shiftType.name}, or archive it to keep it off new rosters.
      </p>

      <div className="mt-6 rounded-lg border bg-card p-6 text-card-foreground">
        <EditShiftTypeForm tenantSlug={tenantSlug} shiftType={shiftType} />
      </div>
    </div>
  );
}
