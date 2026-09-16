'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { resolveTenantContext } from '@/lib/tenancy';
import { getShiftInstance } from '@/lib/shift-instances';
import { getShiftAssignmentOptions } from './index';

/** Shape returned to the assignment form via `useActionState`. */
export interface ShiftAssignmentFormState {
  error?: string;
}

const NO_PERMISSION =
  'You may not have permission to book staff. Ask an owner, admin, or scheduler.';

/**
 * Reconciles which staff are booked onto a shift. The form submits the desired set of employee
 * ids (checked boxes named `employee`); this diffs against the current bookings and applies the
 * minimal inserts/deletes. The shift is confirmed to belong to the tenant, submitted ids are
 * intersected with the tenant's active staff (a forged id can't be booked), and every write is
 * RLS-gated on `shift.book`.
 */
export async function setShiftAssignmentsAction(
  tenantSlug: string,
  shiftInstanceId: string,
  _prev: ShiftAssignmentFormState,
  formData: FormData,
): Promise<ShiftAssignmentFormState> {
  const tenant = await resolveTenantContext(tenantSlug);
  if (!tenant) return { error: 'Workspace not found.' };

  const shift = await getShiftInstance(tenant.id, shiftInstanceId);
  if (!shift) return { error: 'Shift not found.' };

  const options = await getShiftAssignmentOptions(tenant.id, shiftInstanceId);
  const valid = new Set(options.map((o) => o.employeeId));
  const current = new Set(options.filter((o) => o.assigned).map((o) => o.employeeId));
  const desired = new Set(
    formData
      .getAll('employee')
      .map(String)
      .filter((id) => valid.has(id)),
  );

  const toAdd = [...desired].filter((id) => !current.has(id));
  const toRemove = [...current].filter((id) => !desired.has(id));

  const supabase = await createClient();

  if (toAdd.length > 0) {
    const rows = toAdd.map((employeeId) => ({
      tenant_id: tenant.id,
      shift_instance_id: shiftInstanceId,
      employee_id: employeeId,
    }));
    const { error } = await supabase.from('shift_assignments').insert(rows);
    if (error) return { error: NO_PERMISSION };
  }

  if (toRemove.length > 0) {
    const { error } = await supabase
      .from('shift_assignments')
      .delete()
      .eq('tenant_id', tenant.id)
      .eq('shift_instance_id', shiftInstanceId)
      .in('employee_id', toRemove);
    if (error) return { error: NO_PERMISSION };
  }

  revalidatePath(`/${tenantSlug}/roster`);
  redirect(`/${tenantSlug}/roster`);
}
