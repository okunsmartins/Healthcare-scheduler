'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { resolveTenantContext } from '@/lib/tenancy';

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
