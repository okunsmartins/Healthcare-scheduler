'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { resolveTenantContext } from '@/lib/tenancy';

/** Shape returned to the add/edit employee forms via `useActionState`. */
export interface EmployeeFormState {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}
/** @deprecated use {@link EmployeeFormState} — kept as an alias for existing imports. */
export type AddEmployeeState = EmployeeFormState;

const NO_PERMISSION =
  'You may not have permission to manage staff. Ask an admin for the “manage staff” permission.';

const baseFields = {
  fullName: z.string().trim().min(2, 'Enter the staff member’s name.').max(120),
  email: z.union([
    z.string().trim().email('Enter a valid email address.'),
    z.literal(''),
  ]),
  jobTitle: z.string().trim().max(120),
  employmentType: z.enum(['permanent', 'bank', 'agency']),
};

const addEmployeeSchema = z.object(baseFields);
const editEmployeeSchema = z.object({
  ...baseFields,
  status: z.enum(['active', 'suspended', 'archived']),
});

/** Column payload shared by insert/update; `email`/`jobTitle` collapse empty strings to null. */
function columnsFrom(data: z.infer<typeof addEmployeeSchema>) {
  return {
    full_name: data.fullName,
    email: data.email || null,
    job_title: data.jobTitle || null,
    employment_type: data.employmentType,
  };
}

/**
 * Adds a staff member to a workspace. `tenantSlug` is bound by the form; the tenant is
 * re-resolved from the caller's memberships here (never trusted from the client), and the
 * insert is RLS-gated on the `staff.manage` permission at the database.
 */
export async function addEmployeeAction(
  tenantSlug: string,
  _prev: EmployeeFormState,
  formData: FormData,
): Promise<EmployeeFormState> {
  const tenant = await resolveTenantContext(tenantSlug);
  if (!tenant) return { error: 'Workspace not found.' };

  const parsed = addEmployeeSchema.safeParse({
    fullName: formData.get('fullName'),
    email: formData.get('email') ?? '',
    jobTitle: formData.get('jobTitle') ?? '',
    employmentType: formData.get('employmentType') ?? 'permanent',
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('employees')
    .insert({ tenant_id: tenant.id, ...columnsFrom(parsed.data) });
  if (error) return { error: `Could not add the staff member. ${NO_PERMISSION}` };

  revalidatePath(`/${tenantSlug}/people`);
  redirect(`/${tenantSlug}/people`);
}

/**
 * Edits an existing staff member (including archiving, via `status`). Like the add path, the
 * tenant is re-resolved server-side and the update is scoped to it; RLS gates the write on
 * `staff.manage`, so a member without it gets a friendly error rather than a change.
 */
export async function updateEmployeeAction(
  tenantSlug: string,
  employeeId: string,
  _prev: EmployeeFormState,
  formData: FormData,
): Promise<EmployeeFormState> {
  const tenant = await resolveTenantContext(tenantSlug);
  if (!tenant) return { error: 'Workspace not found.' };

  const parsed = editEmployeeSchema.safeParse({
    fullName: formData.get('fullName'),
    email: formData.get('email') ?? '',
    jobTitle: formData.get('jobTitle') ?? '',
    employmentType: formData.get('employmentType') ?? 'permanent',
    status: formData.get('status') ?? 'active',
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('employees')
    .update({ ...columnsFrom(parsed.data), status: parsed.data.status })
    .eq('tenant_id', tenant.id)
    .eq('id', employeeId);
  if (error) return { error: `Could not save changes. ${NO_PERMISSION}` };

  revalidatePath(`/${tenantSlug}/people`);
  redirect(`/${tenantSlug}/people`);
}
