import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Moon, Pencil, Plus } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { resolveTenantContext } from '@/lib/tenancy';
import {
  canManageRoster,
  formatShiftDate,
  getShiftInstances,
  SHIFT_INSTANCE_STATUS_LABEL,
  type ShiftInstance,
} from '@/lib/shift-instances';
import { isOvernight } from '@/lib/shift-types';

export const metadata: Metadata = { title: 'Roster' };

/** Group instances (already sorted by date, then start time) into date buckets. */
function groupByDate(
  instances: ShiftInstance[],
): { date: string; shifts: ShiftInstance[] }[] {
  const groups: { date: string; shifts: ShiftInstance[] }[] = [];
  for (const shift of instances) {
    const last = groups[groups.length - 1];
    if (last && last.date === shift.date) last.shifts.push(shift);
    else groups.push({ date: shift.date, shifts: [shift] });
  }
  return groups;
}

export default async function RosterPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = await resolveTenantContext(tenantSlug);
  if (!tenant) notFound();

  const instances = await getShiftInstances(tenant.id);
  const canManage = canManageRoster(tenant.roleKey);
  const groups = groupByDate(instances);

  return (
    <>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Roster</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Upcoming shifts across the workspace. Assigning staff to shifts arrives on a
            later branch.
          </p>
        </div>
        {canManage ? (
          <Link
            href={`/${tenantSlug}/roster/new`}
            className={cn(buttonVariants(), 'shrink-0')}
          >
            <Plus className="h-4 w-4" aria-hidden />
            New shift
          </Link>
        ) : null}
      </div>

      {groups.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-card p-8 text-card-foreground">
          <p className="text-sm font-medium">No upcoming shifts.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {canManage
              ? 'Schedule a shift to start building the roster. You’ll need at least one department and one shift type first.'
              : 'Shifts scheduled by a manager will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.date}>
              <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
                {formatShiftDate(group.date)}
              </h2>
              <div className="overflow-x-auto rounded-lg border bg-card">
                <table className="w-full text-sm">
                  <tbody>
                    {group.shifts.map((s) => {
                      const cancelled = s.status === 'archived';
                      return (
                        <tr key={s.id} className="border-b last:border-0">
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                'font-medium text-foreground',
                                cancelled && 'text-muted-foreground line-through',
                              )}
                            >
                              {s.shiftType.name}
                            </span>
                            <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                              {s.shiftType.startTime}–{s.shiftType.endTime}
                              {isOvernight(s.shiftType.startTime, s.shiftType.endTime) ? (
                                <Moon className="h-3 w-3" aria-label="Crosses midnight" />
                              ) : null}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {s.department.name}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {s.requiredStaff} needed
                          </td>
                          <td className="px-4 py-3">
                            {s.status === 'active' ? (
                              <span className="text-xs text-muted-foreground">
                                {SHIFT_INSTANCE_STATUS_LABEL[s.status]}
                              </span>
                            ) : (
                              <span
                                className={cn(
                                  'rounded-full border px-2 py-0.5 text-xs font-medium',
                                  cancelled
                                    ? 'border-critical/30 bg-critical/10 text-critical'
                                    : 'border-warning/30 bg-warning/10 text-warning',
                                )}
                              >
                                {SHIFT_INSTANCE_STATUS_LABEL[s.status]}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {canManage ? (
                              <Link
                                href={`/${tenantSlug}/roster/${s.id}/edit`}
                                className={cn(
                                  buttonVariants({ variant: 'ghost', size: 'sm' }),
                                  'text-muted-foreground',
                                )}
                                aria-label={`Edit ${s.shiftType.name} on ${group.date}`}
                              >
                                <Pencil className="h-4 w-4" aria-hidden />
                                Edit
                              </Link>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
