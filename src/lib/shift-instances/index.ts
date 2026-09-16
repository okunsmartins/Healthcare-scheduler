import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { ShiftInstance, ShiftInstanceStatus } from './types';

export type { ShiftInstance, ShiftInstanceStatus } from './types';
export {
  SHIFT_INSTANCE_STATUS,
  SHIFT_INSTANCE_STATUS_LABEL,
  canManageRoster,
  formatShiftDate,
} from './types';

// Single string literal (not concatenated) so supabase-js can infer the row shape.
const SHIFT_INSTANCE_COLUMNS =
  'id, shift_date, required_staff, notes, status, departments(id, name), shift_types(id, name, start_time, end_time), shift_assignments(count)';

/** Postgres `time` comes back "HH:MM:SS"; trim to "HH:MM". */
function toHHMM(value: unknown): string {
  return typeof value === 'string' ? value.slice(0, 5) : '';
}

function toShiftInstance(row: Record<string, unknown>): ShiftInstance {
  const dept = row.departments as { id: string; name: string } | null;
  const type = row.shift_types as {
    id: string;
    name: string;
    start_time: string;
    end_time: string;
  } | null;
  const assignments = row.shift_assignments as { count: number }[] | null | undefined;
  return {
    id: row.id as string,
    date: row.shift_date as string,
    requiredStaff: row.required_staff as number,
    assignedCount: assignments?.[0]?.count ?? 0,
    notes: (row.notes as string | null) ?? null,
    status: row.status as ShiftInstanceStatus,
    department: { id: dept?.id ?? '', name: dept?.name ?? 'Unknown department' },
    shiftType: {
      id: type?.id ?? '',
      name: type?.name ?? 'Unknown shift',
      startTime: toHHMM(type?.start_time),
      endTime: toHHMM(type?.end_time),
    },
  };
}

/**
 * Shift instances for a tenant, joined to their department + shift type, read through the
 * RLS-aware server client. Defaults to today onward (the roster view). Ordered by date, then
 * shift start time. Cached per request.
 *
 * Server-only: importing this pulls in the Supabase server client (`next/headers`). Client
 * components must import types/helpers from `./types` instead.
 */
export const getShiftInstances = cache(
  async (tenantId: string, opts?: { from?: string }): Promise<ShiftInstance[]> => {
    const from = opts?.from ?? new Date().toISOString().slice(0, 10);
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('shift_instances')
      .select(SHIFT_INSTANCE_COLUMNS)
      .eq('tenant_id', tenantId)
      .gte('shift_date', from)
      .order('shift_date');

    if (error || !data) return [];
    return (data as unknown as Record<string, unknown>[])
      .map(toShiftInstance)
      .sort(
        (a, b) =>
          a.date.localeCompare(b.date) ||
          a.shiftType.startTime.localeCompare(b.shiftType.startTime),
      );
  },
);

/** A single shift instance scoped to the tenant, or `null` if it doesn't exist / isn't visible. */
export const getShiftInstance = cache(
  async (tenantId: string, id: string): Promise<ShiftInstance | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('shift_instances')
      .select(SHIFT_INSTANCE_COLUMNS)
      .eq('tenant_id', tenantId)
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;
    return toShiftInstance(data as unknown as Record<string, unknown>);
  },
);
