'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { resolveTenantContext } from '@/lib/tenancy';
import { getEmployee } from '@/lib/employees';
import { getSkillAssignment } from './index';

/** Shape returned to the add/edit skill forms via `useActionState`. */
export interface SkillFormState {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

const NO_PERMISSION =
  'You may not have permission to manage skills. Ask an owner or admin.';

const baseFields = {
  name: z.string().trim().min(2, 'Enter a skill name.').max(80),
};

const addSkillSchema = z.object(baseFields);
const editSkillSchema = z.object({
  ...baseFields,
  status: z.enum(['active', 'suspended', 'archived']),
});

/** Maps a Postgres unique-violation on the name to a field error; friendly rest otherwise. */
function messageForError(error: { code?: string }): SkillFormState {
  if (error.code === '23505') {
    return { fieldErrors: { name: ['That skill already exists in this workspace.'] } };
  }
  return { error: NO_PERMISSION };
}

/**
 * Creates a skill. `tenantSlug` is bound by the form; the tenant is re-resolved from the caller's
 * memberships here (never trusted from the client), and the insert is RLS-gated on the
 * `staff.manage` permission at the database.
 */
export async function addSkillAction(
  tenantSlug: string,
  _prev: SkillFormState,
  formData: FormData,
): Promise<SkillFormState> {
  const tenant = await resolveTenantContext(tenantSlug);
  if (!tenant) return { error: 'Workspace not found.' };

  const parsed = addSkillSchema.safeParse({ name: formData.get('name') });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase
    .from('skills')
    .insert({ tenant_id: tenant.id, name: parsed.data.name });
  if (error) return messageForError(error);

  revalidatePath(`/${tenantSlug}/settings/skills`);
  redirect(`/${tenantSlug}/settings/skills`);
}

/**
 * Edits a skill (including archiving, via `status`). Tenant re-resolved server-side and the
 * update scoped to it; RLS gates the write on `staff.manage`.
 */
export async function updateSkillAction(
  tenantSlug: string,
  skillId: string,
  _prev: SkillFormState,
  formData: FormData,
): Promise<SkillFormState> {
  const tenant = await resolveTenantContext(tenantSlug);
  if (!tenant) return { error: 'Workspace not found.' };

  const parsed = editSkillSchema.safeParse({
    name: formData.get('name'),
    status: formData.get('status') ?? 'active',
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase
    .from('skills')
    .update({ name: parsed.data.name, status: parsed.data.status })
    .eq('tenant_id', tenant.id)
    .eq('id', skillId);
  if (error) return messageForError(error);

  revalidatePath(`/${tenantSlug}/settings/skills`);
  redirect(`/${tenantSlug}/settings/skills`);
}

/**
 * Reconciles which skills an employee holds. The form submits the desired set of skill ids
 * (checked boxes named `skill`); this diffs against the currently-held **active** skills and
 * applies the minimal `employee_skills` inserts/deletes. Submitted ids are intersected with the
 * tenant's active catalog first (a forged/archived id can't be linked), and every write is
 * RLS-gated on `staff.manage`. Archived skills the employee already holds are left untouched.
 */
export async function setEmployeeSkillsAction(
  tenantSlug: string,
  employeeId: string,
  _prev: SkillFormState,
  formData: FormData,
): Promise<SkillFormState> {
  const tenant = await resolveTenantContext(tenantSlug);
  if (!tenant) return { error: 'Workspace not found.' };

  const employee = await getEmployee(tenant.id, employeeId);
  if (!employee) return { error: 'Staff member not found.' };

  const options = await getSkillAssignment(tenant.id, employeeId);
  const valid = new Set(options.map((o) => o.skillId));
  const current = new Set(options.filter((o) => o.assigned).map((o) => o.skillId));
  const desired = new Set(
    formData
      .getAll('skill')
      .map(String)
      .filter((id) => valid.has(id)),
  );

  const toAdd = [...desired].filter((id) => !current.has(id));
  const toRemove = [...current].filter((id) => !desired.has(id));

  const supabase = await createClient();

  if (toAdd.length > 0) {
    const rows = toAdd.map((skillId) => ({
      tenant_id: tenant.id,
      employee_id: employeeId,
      skill_id: skillId,
    }));
    const { error } = await supabase.from('employee_skills').insert(rows);
    if (error) return { error: NO_PERMISSION };
  }

  if (toRemove.length > 0) {
    const { error } = await supabase
      .from('employee_skills')
      .delete()
      .eq('tenant_id', tenant.id)
      .eq('employee_id', employeeId)
      .in('skill_id', toRemove);
    if (error) return { error: NO_PERMISSION };
  }

  revalidatePath(`/${tenantSlug}/people/${employeeId}`);
  redirect(`/${tenantSlug}/people/${employeeId}`);
}
