// Client-safe shift-type types/helpers — no server-only imports, so this can be pulled into
// client components. Server-only reads (getShiftTypes) live in ./index.ts.

/** Shift-type lifecycle status (shares `public.lifecycle_status`). */
export type ShiftTypeStatus = 'active' | 'suspended' | 'archived';

export interface ShiftType {
  id: string;
  name: string;
  /** Local wall-clock times as "HH:MM" (Postgres `time`, seconds trimmed). */
  startTime: string;
  endTime: string;
  status: ShiftTypeStatus;
}

/** Lifecycle statuses in the order they appear in the edit form. */
export const SHIFT_TYPE_STATUS: ShiftTypeStatus[] = ['active', 'suspended', 'archived'];

/** Display labels for the shift-type status (archiving is the soft-delete). */
export const SHIFT_TYPE_STATUS_LABEL: Record<ShiftTypeStatus, string> = {
  active: 'Active',
  suspended: 'Suspended',
  archived: 'Archived',
};

/**
 * Roles that may manage shift types — mirrors the `roster.edit` grant
 * (owner + admin + manager + scheduler; RLS is authoritative).
 */
export function canManageShiftTypes(roleKey: string): boolean {
  return (
    roleKey === 'owner' ||
    roleKey === 'admin' ||
    roleKey === 'manager' ||
    roleKey === 'scheduler'
  );
}

/** Minutes past midnight for an "HH:MM" time, or null if it can't be parsed. */
function minutesOf(time: string): number | null {
  const match = /^(\d{2}):(\d{2})/.exec(time);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** True when the shift crosses midnight (end at or before start, e.g. 20:00 → 08:00). */
export function isOvernight(startTime: string, endTime: string): boolean {
  const start = minutesOf(startTime);
  const end = minutesOf(endTime);
  if (start === null || end === null) return false;
  return end <= start;
}

/** Shift length in whole minutes, accounting for an overnight wrap. Null if unparseable. */
export function durationMinutes(startTime: string, endTime: string): number | null {
  const start = minutesOf(startTime);
  const end = minutesOf(endTime);
  if (start === null || end === null) return null;
  const raw = end - start;
  return raw > 0 ? raw : raw + 24 * 60;
}

/** Human-readable length, e.g. "8h", "8h 30m", or "" if unknown. */
export function formatDuration(startTime: string, endTime: string): string {
  const total = durationMinutes(startTime, endTime);
  if (total === null || total === 0) return '';
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
