'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

/** Shape returned to the create-workspace form via `useActionState`. */
export interface CreateWorkspaceState {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

const createWorkspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Enter at least 2 characters.')
    .max(80, 'Keep the name under 80 characters.'),
});

/**
 * Creates a workspace for the current user and drops them into it. The tenant, its settings,
 * and an owner membership are created atomically by the `create_tenant` DB function (a
 * SECURITY DEFINER routine — `tenants` has no INSERT policy), so this never trusts the client
 * with tenant creation beyond a validated name.
 */
export async function createWorkspaceAction(
  _prev: CreateWorkspaceState,
  formData: FormData,
): Promise<CreateWorkspaceState> {
  const parsed = createWorkspaceSchema.safeParse({ name: formData.get('name') });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('create_tenant', {
    p_name: parsed.data.name,
  });
  if (error || !data) {
    return { error: 'Could not create the workspace. Please try again.' };
  }

  // create_tenant returns the new tenants row; take its slug to route into the workspace.
  const row = (Array.isArray(data) ? data[0] : data) as { slug?: string } | null;
  const slug = row?.slug;
  if (!slug) {
    return { error: 'Could not create the workspace. Please try again.' };
  }

  revalidatePath('/workspaces');
  redirect(`/${slug}/dashboard`);
}
