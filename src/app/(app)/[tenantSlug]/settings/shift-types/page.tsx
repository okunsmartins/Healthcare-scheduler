import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Moon, Pencil, Plus } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { resolveTenantContext } from '@/lib/tenancy';
import {
  canManageShiftTypes,
  formatDuration,
  getShiftTypes,
  isOvernight,
} from '@/lib/shift-types';

export const metadata: Metadata = { title: 'Shift types' };

const STATUS_TONE = {
  active: 'safe',
  suspended: 'suspended',
  archived: 'archived',
} as const;

export default async function ShiftTypesPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = await resolveTenantContext(tenantSlug);
  if (!tenant) notFound();
  // Management is owner/admin/manager/scheduler (roster.edit); RLS is authoritative on writes.
  if (!canManageShiftTypes(tenant.roleKey)) redirect(`/${tenantSlug}/settings`);

  const shiftTypes = await getShiftTypes(tenant.id);

  return (
    <>
      <Link
        href={`/${tenantSlug}/settings`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to settings
      </Link>

      <div className="mb-8 mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Shift types</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            The shift patterns rosters are built from. Building actual rosters arrives on
            a later branch.
          </p>
        </div>
        <Link
          href={`/${tenantSlug}/settings/shift-types/new`}
          className={cn(buttonVariants(), 'shrink-0')}
        >
          <Plus className="h-4 w-4" aria-hidden />
          New shift type
        </Link>
      </div>

      {shiftTypes.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-card p-8 text-card-foreground">
          <p className="text-sm font-medium">No shift types yet.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your first shift type (e.g. Day 08:00–20:00) to start building rosters.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Length</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {shiftTypes.map((s) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{s.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      {s.startTime}–{s.endTime}
                      {isOvernight(s.startTime, s.endTime) ? (
                        <Moon className="h-3.5 w-3.5" aria-label="Crosses midnight" />
                      ) : null}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDuration(s.startTime, s.endTime) || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={STATUS_TONE[s.status]} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/${tenantSlug}/settings/shift-types/${s.id}/edit`}
                      className={cn(
                        buttonVariants({ variant: 'ghost', size: 'sm' }),
                        'text-muted-foreground',
                      )}
                      aria-label={`Edit ${s.name}`}
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                      Edit
                    </Link>
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
