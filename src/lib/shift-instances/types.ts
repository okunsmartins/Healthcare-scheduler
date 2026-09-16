// Client-safe shift-instance types/helpers — no server-only imports, so this can be pulled into
// client components. Server-only reads (getShiftInstances) live in ./index.ts.

export type ShiftInstanceStatus = 'active' | 'suspended' | 'archived';

/** A scheduled shift, with its department + shift type resolved for display. */
export interface ShiftInstance {
  id: string;
  /** ISO date "YYYY-MM-DD". */
  date: string;
  requiredStaff: number;
  notes: string | null;
  status: ShiftInstanceStatus;
  department: { id: string; name: string };
  shiftType: { id: string; name: string; startTime: string; endTime: string };
}

export const SHIFT_INSTANCE_STATUS: ShiftInstanceStatus[] = [
  'active',
  'suspended',
  'archived',
];

/** Display labels; `archived` reads as "Cancelled" for a scheduled shift. */
export const SHIFT_INSTANCE_STATUS_LABEL: Record<ShiftInstanceStatus, string> = {
  active: 'Scheduled',
  suspended: 'On hold',
  archived: 'Cancelled',
};

/**
 * Roles that may manage the roster — mirrors the `roster.edit` grant
 * (owner + admin + manager + scheduler; RLS is authoritative).
 */
export function canManageRoster(roleKey: string): boolean {
  return (
    roleKey === 'owner' ||
    roleKey === 'admin' ||
    roleKey === 'manager' ||
    roleKey === 'scheduler'
  );
}

/** Format an ISO date as e.g. "Mon 16 Sep 2026" for roster day headers. */
export function formatShiftDate(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('en-IE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
