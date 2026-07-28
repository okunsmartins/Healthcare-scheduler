'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { resolveTenantContext } from '@/lib/tenancy';
import { getDepartment, getDepartmentAccess } from './index';

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

/**
 * Reconciles which members are scoped to a department. The form submits the desired set of
 * membership ids (checked boxes named `member`); this diffs against the current set and
 * applies the minimal inserts/deletes. Submitted ids are intersected with the tenant's actual
 * members first (so a forged id can't be linked), and every write is RLS-gated on
 * `departments.manage`.
 */
export async function setDepartmentAccessAction(
  tenantSlug: string,
  departmentId: string,
  _prev: DepartmentFormState,
  formData: FormData,
): Promise<DepartmentFormState> {
  const tenant = await resolveTenantContext(tenantSlug);
  if (!tenant) return { error: 'Workspace not found.' };

  const department = await getDepartment(tenant.id, departmentId);
  if (!department) return { error: 'Department not found.' };

  // Current + valid members for this department (also the allow-list of assignable ids).
  const access = await getDepartmentAccess(tenant.id, departmentId);
  const valid = new Set(access.map((m) => m.membershipId));
  const current = new Set(access.filter((m) => m.assigned).map((m) => m.membershipId));
  const desired = new Set(
    formData
      .getAll('member')
      .map(String)
      .filter((id) => valid.has(id)),
  );

  const toAdd = [...desired].filter((id) => !current.has(id));
  const toRemove = [...current].filter((id) => !desired.has(id));

  const supabase = await createClient();

  if (toAdd.length > 0) {
    const rows = toAdd.map((membershipId) => ({
      tenant_id: tenant.id,
      department_id: departmentId,
      membership_id: membershipId,
    }));
    const { error } = await supabase.from('department_memberships').insert(rows);
    if (error) return { error: NO_PERMISSION };
  }

  if (toRemove.length > 0) {
    const { error } = await supabase
      .from('department_memberships')
      .delete()
      .eq('tenant_id', tenant.id)
      .eq('department_id', departmentId)
      .in('membership_id', toRemove);
    if (error) return { error: NO_PERMISSION };
  }

  revalidatePath(`/${tenantSlug}/settings/departments`);
  redirect(`/${tenantSlug}/settings/departments`);
}
