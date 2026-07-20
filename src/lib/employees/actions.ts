'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { resolveTenantContext } from '@/lib/tenancy';

/** Shape returned to the add-employee form via `useActionState`. */
export interface AddEmployeeState {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

const addEmployeeSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter the staff member’s name.').max(120),
  email: z.union([
    z.string().trim().email('Enter a valid email address.'),
    z.literal(''),
  ]),
  jobTitle: z.string().trim().max(120),
  employmentType: z.enum(['permanent', 'bank', 'agency']),
});

/**
 * Adds a staff member to a workspace. `tenantSlug` is bound by the form; the tenant is
 * re-resolved from the caller's memberships here (never trusted from the client), and the
 * insert is RLS-gated on the `staff.manage` permission at the database.
 */
export async function addEmployeeAction(
  tenantSlug: string,
  _prev: AddEmployeeState,
  formData: FormData,
): Promise<AddEmployeeState> {
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
  const { error } = await supabase.from('employees').insert({
    tenant_id: tenant.id,
    full_name: parsed.data.fullName,
    email: parsed.data.email || null,
    job_title: parsed.data.jobTitle || null,
    employment_type: parsed.data.employmentType,
  });
  if (error) {
    return {
      error:
        'Could not add the staff member. You may not have permission to manage staff.',
    };
  }

  revalidatePath(`/${tenantSlug}/people`);
  redirect(`/${tenantSlug}/people`);
}
