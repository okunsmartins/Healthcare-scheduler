import { cache } from 'react';
import { getUser } from '@/lib/auth/user';
import { createClient } from '@/lib/supabase/server';

/**
 * A tenant the current user actively belongs to, with the role they hold there.
 * Resolved server-side from `memberships` — never from a client-supplied tenant id.
 */
export interface Membership {
  tenantId: string;
  slug: string;
  name: string;
  roleKey: string;
  roleName: string;
}

/** The active tenant for a `[tenantSlug]` route, once membership is verified. */
export interface TenantContext {
  id: string;
  slug: string;
  name: string;
  roleKey: string;
}

/**
 * The current user's active memberships (tenant + role), read through the RLS-aware server
 * client so a user can only ever see their own. Empty when signed out. Cached per request.
 *
 * RLS lets a member read every membership row in their tenants, so we filter to the current
 * user explicitly — this returns *my* memberships, not everyone's.
 */
export const getMyMemberships = cache(async (): Promise<Membership[]> => {
  const user = await getUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('memberships')
    .select('tenant_id, tenants!inner(slug, name), role_definitions!inner(key, name)')
    .eq('profile_id', user.id)
    .eq('status', 'active');

  if (error || !data) return [];

  // The client has no generated types, so shape the loosely-typed rows here.
  return data.map((row): Membership => {
    const tenant = row.tenants as unknown as { slug: string; name: string };
    const role = row.role_definitions as unknown as { key: string; name: string };
    return {
      tenantId: row.tenant_id as string,
      slug: tenant.slug,
      name: tenant.name,
      roleKey: role.key,
      roleName: role.name,
    };
  });
});

/**
 * Resolve the `[tenantSlug]` segment to a tenant the user is a member of, or `null`. A `null`
 * result means "not a member (or no such tenant)" — callers should 404 rather than reveal
 * which case it is.
 */
export async function resolveTenantContext(slug: string): Promise<TenantContext | null> {
  const memberships = await getMyMemberships();
  const match = memberships.find((m) => m.slug === slug);
  return match
    ? { id: match.tenantId, slug: match.slug, name: match.name, roleKey: match.roleKey }
    : null;
}
