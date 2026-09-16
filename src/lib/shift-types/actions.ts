'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { resolveTenantContext } from '@/lib/tenancy';

/** Shape returned to the add/edit shift-type forms via `useActionState`. */
export interface ShiftTypeFormState {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

const NO_PERMISSION =
  'You may not have permission to manage shift types. Ask an owner, admin, or scheduler.';

const timeField = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Enter a time as HH:MM.');

const baseFields = {
  name: z.string().trim().min(2, 'Enter a shift-type name.').max(60),
  startTime: timeField,
  endTime: timeField,
};

const addShiftTypeSchema = z.object(baseFields);
const editShiftTypeSchema = z.object({
  ...baseFields,
  status: z.enum(['active', 'suspended', 'archived']),
});

/** Maps a Postgres unique-violation on the name to a field error; friendly rest otherwise. */
function messageForError(error: { code?: string }): ShiftTypeFormState {
  if (error.code === '23505') {
    return { fieldErrors: { name: ['A shift type with that name already exists.'] } };
  }
  return { error: NO_PERMISSION };
}

/**
 * Creates a shift type. `tenantSlug` is bound by the form; the tenant is re-resolved from the
 * caller's memberships here (never trusted from the client), and the insert is RLS-gated on the
 * `roster.edit` permission at the database.
 */
export async function addShiftTypeAction(
  tenantSlug: string,
  _prev: ShiftTypeFormState,
  formData: FormData,
): Promise<ShiftTypeFormState> {
  const tenant = await resolveTenantContext(tenantSlug);
  if (!tenant) return { error: 'Workspace not found.' };

  const parsed = addShiftTypeSchema.safeParse({
    name: formData.get('name'),
    startTime: formData.get('startTime'),
    endTime: formData.get('endTime'),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase.from('shift_types').insert({
    tenant_id: tenant.id,
    name: parsed.data.name,
    start_time: parsed.data.startTime,
    end_time: parsed.data.endTime,
  });
  if (error) return messageForError(error);

  revalidatePath(`/${tenantSlug}/settings/shift-types`);
  redirect(`/${tenantSlug}/settings/shift-types`);
}

/**
 * Edits a shift type (including archiving, via `status`). Tenant re-resolved server-side and the
 * update scoped to it; RLS gates the write on `roster.edit`.
 */
export async function updateShiftTypeAction(
  tenantSlug: string,
  shiftTypeId: string,
  _prev: ShiftTypeFormState,
  formData: FormData,
): Promise<ShiftTypeFormState> {
  const tenant = await resolveTenantContext(tenantSlug);
  if (!tenant) return { error: 'Workspace not found.' };

  const parsed = editShiftTypeSchema.safeParse({
    name: formData.get('name'),
    startTime: formData.get('startTime'),
    endTime: formData.get('endTime'),
    status: formData.get('status') ?? 'active',
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase
    .from('shift_types')
    .update({
      name: parsed.data.name,
      start_time: parsed.data.startTime,
      end_time: parsed.data.endTime,
      status: parsed.data.status,
    })
    .eq('tenant_id', tenant.id)
    .eq('id', shiftTypeId);
  if (error) return messageForError(error);

  revalidatePath(`/${tenantSlug}/settings/shift-types`);
  redirect(`/${tenantSlug}/settings/shift-types`);
}
