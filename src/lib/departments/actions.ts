'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { resolveTenantContext } from '@/lib/tenancy';

/** Shape returned to the add/edit department forms via `useActionState`. */
export interface DepartmentFormState {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

const NO_PERMISSION =
  'You may not have permission to manage departments. Ask an owner or admin.';

const baseFields = {
  name: z.string().trim().min(2, 'Enter a department name.').max(120),
  // Optional short code; uppercased for consistency. Unique per tenant (enforced by the DB).
  code: z
    .string()
    .trim()
    .max(16, 'Use 16 characters or fewer.')
    .transform((c) => c.toUpperCase()),
};

const addDepartmentSchema = z.object(baseFields);
const editDepartmentSchema = z.object({
  ...baseFields,
  status: z.enum(['active', 'suspended', 'archived']),
});

/** Maps a Postgres unique-violation on the code to a field error; rethrows the friendly rest. */
function messageForError(error: { code?: string }): DepartmentFormState {
  if (error.code === '23505') {
    return {
      fieldErrors: { code: ['That code is already used by another department.'] },
    };
  }
  return { error: NO_PERMISSION };
}

/**
 * Creates a department. `tenantSlug` is bound by the form; the tenant is re-resolved from the
 * caller's memberships here (never trusted from the client), and the insert is RLS-gated on the
 * `departments.manage` permission at the database.
 */
export async function addDepartmentAction(
  tenantSlug: string,
  _prev: DepartmentFormState,
  formData: FormData,
): Promise<DepartmentFormState> {
  const tenant = await resolveTenantContext(tenantSlug);
  if (!tenant) return { error: 'Workspace not found.' };

  const parsed = addDepartmentSchema.safeParse({
    name: formData.get('name'),
    code: formData.get('code') ?? '',
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase.from('departments').insert({
    tenant_id: tenant.id,
    name: parsed.data.name,
    code: parsed.data.code || null,
  });
  if (error) return messageForError(error);

  revalidatePath(`/${tenantSlug}/settings/departments`);
  redirect(`/${tenantSlug}/settings/departments`);
}

/**
 * Edits a department (including archiving, via `status`). Tenant re-resolved server-side and the
 * update scoped to it; RLS gates the write on `departments.manage`.
 */
export async function updateDepartmentAction(
  tenantSlug: string,
  departmentId: string,
  _prev: DepartmentFormState,
  formData: FormData,
): Promise<DepartmentFormState> {
  const tenant = await resolveTenantContext(tenantSlug);
  if (!tenant) return { error: 'Workspace not found.' };

  const parsed = editDepartmentSchema.safeParse({
    name: formData.get('name'),
    code: formData.get('code') ?? '',
    status: formData.get('status') ?? 'active',
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase
    .from('departments')
    .update({
      name: parsed.data.name,
      code: parsed.data.code || null,
      status: parsed.data.status,
    })
    .eq('tenant_id', tenant.id)
    .eq('id', departmentId);
  if (error) return messageForError(error);

  revalidatePath(`/${tenantSlug}/settings/departments`);
  redirect(`/${tenantSlug}/settings/departments`);
}
