'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { resolveTenantContext } from '@/lib/tenancy';
import { getDepartment } from '@/lib/departments';
import { getShiftType } from '@/lib/shift-types';

/** Shape returned to the add/edit shift-instance forms via `useActionState`. */
export interface ShiftInstanceFormState {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

const NO_PERMISSION =
  'You may not have permission to manage the roster. Ask an owner, admin, or scheduler.';

const baseFields = {
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a valid date.'),
  departmentId: z.string().uuid('Choose a department.'),
  shiftTypeId: z.string().uuid('Choose a shift type.'),
  requiredStaff: z.coerce
    .number()
    .int('Enter a whole number.')
    .min(1, 'At least one staff member is required.')
    .max(99, 'Use 99 or fewer.'),
  notes: z.union([z.string().trim().max(500), z.literal('')]),
};

const addSchema = z.object(baseFields);
const editSchema = z.object({
  ...baseFields,
  status: z.enum(['active', 'suspended', 'archived']),
});

/** Maps a Postgres unique-violation to a friendly message; the rest is a permission error. */
function messageForError(error: { code?: string }): ShiftInstanceFormState {
  if (error.code === '23505') {
    return {
      error:
        'That shift type is already scheduled for that department on that date. Edit the existing shift instead.',
    };
  }
  return { error: NO_PERMISSION };
}

/**
 * Confirms the referenced department + shift type both belong to this tenant (so a tampered form
 * can't reference another workspace's rows). Returns field errors, or the validated payload.
 */
async function resolveRefs(
  tenantId: string,
  departmentId: string,
  shiftTypeId: string,
): Promise<ShiftInstanceFormState | null> {
  const [department, shiftType] = await Promise.all([
    getDepartment(tenantId, departmentId),
    getShiftType(tenantId, shiftTypeId),
  ]);
  const fieldErrors: Record<string, string[]> = {};
  if (!department) fieldErrors.departmentId = ['Choose a department in this workspace.'];
  if (!shiftType) fieldErrors.shiftTypeId = ['Choose a shift type in this workspace.'];
  return Object.keys(fieldErrors).length > 0 ? { fieldErrors } : null;
}

/**
 * Schedules a shift instance. `tenantSlug` is bound by the form; the tenant is re-resolved from
 * the caller's memberships, the department + shift type are confirmed to belong to it, and the
 * insert is RLS-gated on `roster.edit`.
 */
export async function addShiftInstanceAction(
  tenantSlug: string,
  _prev: ShiftInstanceFormState,
  formData: FormData,
): Promise<ShiftInstanceFormState> {
  const tenant = await resolveTenantContext(tenantSlug);
  if (!tenant) return { error: 'Workspace not found.' };

  const parsed = addSchema.safeParse({
    date: formData.get('date'),
    departmentId: formData.get('departmentId'),
    shiftTypeId: formData.get('shiftTypeId'),
    requiredStaff: formData.get('requiredStaff'),
    notes: formData.get('notes') ?? '',
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const refError = await resolveRefs(
    tenant.id,
    parsed.data.departmentId,
    parsed.data.shiftTypeId,
  );
  if (refError) return refError;

  const supabase = await createClient();
  const { error } = await supabase.from('shift_instances').insert({
    tenant_id: tenant.id,
    department_id: parsed.data.departmentId,
    shift_type_id: parsed.data.shiftTypeId,
    shift_date: parsed.data.date,
    required_staff: parsed.data.requiredStaff,
    notes: parsed.data.notes || null,
  });
  if (error) return messageForError(error);

  revalidatePath(`/${tenantSlug}/roster`);
  redirect(`/${tenantSlug}/roster`);
}

/**
 * Edits a shift instance (including cancelling, via `status`). Tenant re-resolved server-side,
 * refs re-validated, update scoped to the tenant; RLS gates the write on `roster.edit`.
 */
export async function updateShiftInstanceAction(
  tenantSlug: string,
  shiftInstanceId: string,
  _prev: ShiftInstanceFormState,
  formData: FormData,
): Promise<ShiftInstanceFormState> {
  const tenant = await resolveTenantContext(tenantSlug);
  if (!tenant) return { error: 'Workspace not found.' };

  const parsed = editSchema.safeParse({
    date: formData.get('date'),
    departmentId: formData.get('departmentId'),
    shiftTypeId: formData.get('shiftTypeId'),
    requiredStaff: formData.get('requiredStaff'),
    notes: formData.get('notes') ?? '',
    status: formData.get('status') ?? 'active',
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const refError = await resolveRefs(
    tenant.id,
    parsed.data.departmentId,
    parsed.data.shiftTypeId,
  );
  if (refError) return refError;

  const supabase = await createClient();
  const { error } = await supabase
    .from('shift_instances')
    .update({
      department_id: parsed.data.departmentId,
      shift_type_id: parsed.data.shiftTypeId,
      shift_date: parsed.data.date,
      required_staff: parsed.data.requiredStaff,
      notes: parsed.data.notes || null,
      status: parsed.data.status,
    })
    .eq('tenant_id', tenant.id)
    .eq('id', shiftInstanceId);
  if (error) return messageForError(error);

  revalidatePath(`/${tenantSlug}/roster`);
  redirect(`/${tenantSlug}/roster`);
}
