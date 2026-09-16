import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { AssignableStaff } from './types';

export type { AssignableStaff } from './types';
export { canAssignStaff } from './types';

/**
 * The tenant's **active** staff, each flagged with whether they're booked onto `shiftInstanceId`.
 * Drives the assignment screen. Reads through RLS (any member); sorted by name. Cached per request.
 *
 * Server-only: importing this pulls in the Supabase server client (`next/headers`).
 */
export const getShiftAssignmentOptions = cache(
  async (tenantId: string, shiftInstanceId: string): Promise<AssignableStaff[]> => {
    const supabase = await createClient();
    const [staff, booked] = await Promise.all([
      supabase
        .from('employees')
        .select('id, full_name, job_title')
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .order('full_name'),
      supabase
        .from('shift_assignments')
        .select('employee_id')
        .eq('tenant_id', tenantId)
        .eq('shift_instance_id', shiftInstanceId),
    ]);

    if (staff.error || !staff.data) return [];
    const bookedIds = new Set(
      (booked.data ?? []).map((row) => row.employee_id as string),
    );
    return staff.data.map((row): AssignableStaff => {
      const id = row.id as string;
      return {
        employeeId: id,
        name: (row.full_name as string) || 'Unknown',
        jobTitle: (row.job_title as string | null) ?? null,
        assigned: bookedIds.has(id),
      };
    });
  },
);
