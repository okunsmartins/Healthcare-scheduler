import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { ShiftType, ShiftTypeStatus } from './types';

export type { ShiftType, ShiftTypeStatus } from './types';
export {
  SHIFT_TYPE_STATUS,
  SHIFT_TYPE_STATUS_LABEL,
  canManageShiftTypes,
  isOvernight,
  durationMinutes,
  formatDuration,
} from './types';

const SHIFT_TYPE_COLUMNS = 'id, name, start_time, end_time, status';

/** Postgres `time` comes back as "HH:MM:SS"; trim to "HH:MM" for the UI + `<input type=time>`. */
function toHHMM(value: unknown): string {
  return typeof value === 'string' ? value.slice(0, 5) : '';
}

function toShiftType(row: Record<string, unknown>): ShiftType {
  return {
    id: row.id as string,
    name: row.name as string,
    startTime: toHHMM(row.start_time),
    endTime: toHHMM(row.end_time),
    status: row.status as ShiftTypeStatus,
  };
}

/**
 * The tenant's shift-type catalog, read through the RLS-aware server client (a member only ever
 * sees their own tenant's shift types). Sorted by start time then name. Cached per request.
 *
 * Server-only: importing this pulls in the Supabase server client (`next/headers`). Client
 * components must import types/helpers from `./types` instead.
 */
export const getShiftTypes = cache(async (tenantId: string): Promise<ShiftType[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('shift_types')
    .select(SHIFT_TYPE_COLUMNS)
    .eq('tenant_id', tenantId)
    .order('start_time')
    .order('name');

  if (error || !data) return [];
  return data.map(toShiftType);
});

/** A single shift type scoped to the tenant, or `null` if it doesn't exist / isn't visible. */
export const getShiftType = cache(
  async (tenantId: string, id: string): Promise<ShiftType | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('shift_types')
      .select(SHIFT_TYPE_COLUMNS)
      .eq('tenant_id', tenantId)
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;
    return toShiftType(data);
  },
);
