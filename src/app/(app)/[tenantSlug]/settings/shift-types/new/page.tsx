import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { AddShiftTypeForm } from '@/components/shift-types/add-shift-type-form';
import { canManageShiftTypes } from '@/lib/shift-types';
import { resolveTenantContext } from '@/lib/tenancy';

export const metadata: Metadata = { title: 'New shift type' };

export default async function NewShiftTypePage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = await resolveTenantContext(tenantSlug);
  if (!tenant) notFound();
  // Guard for non-managers; RLS is the authoritative check on the insert itself.
  if (!canManageShiftTypes(tenant.roleKey)) redirect(`/${tenantSlug}/settings`);

  return (
    <div className="max-w-md">
      <Link
        href={`/${tenantSlug}/settings/shift-types`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to shift types
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">New shift type</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Define a shift pattern (name and start/end times). You can rename or archive it
        later.
      </p>

      <div className="mt-6 rounded-lg border bg-card p-6 text-card-foreground">
        <AddShiftTypeForm tenantSlug={tenantSlug} />
      </div>
    </div>
  );
}
