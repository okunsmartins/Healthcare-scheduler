import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { Department, DepartmentMember, DepartmentStatus } from './types';

export type { Department, DepartmentStatus, DepartmentMember } from './types';
export {
  DEPARTMENT_STATUS,
  DEPARTMENT_STATUS_LABEL,
  canManageDepartments,
} from './types';

// Embeds a member count via PostgREST's aggregate embedding. `department_memberships` is
// readable to any tenant member under RLS, so the count reflects everyone scoped to the dept.
const DEPARTMENT_COLUMNS = 'id, name, code, status, department_memberships(count)';

function toDepartment(row: Record<string, unknown>): Department {
  const links = row.department_memberships as { count: number }[] | null | undefined;
  return {
    id: row.id as string,
    name: row.name as string,
    code: (row.code as string | null) ?? null,
    status: row.status as DepartmentStatus,
    memberCount: links?.[0]?.count ?? 0,
  };
}

/**
 * Departments for a tenant, read through the RLS-aware server client. Note the `departments`
 * SELECT policy is department-scoped (`app.is_department_member`), so a restricted member sees
 * only their linked departments; an owner/admin (unrestricted) sees them all — which is who the
 * management screens are gated to. Cached per request.
 *
 * Server-only: importing this pulls in the Supabase server client (`next/headers`). Client
 * components must import types/labels from `./types` instead.
 */
export const getDepartments = cache(async (tenantId: string): Promise<Department[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('departments')
    .select(DEPARTMENT_COLUMNS)
    .eq('tenant_id', tenantId)
    .order('name');

  if (error || !data) return [];
  return data.map(toDepartment);
});

/** A single department scoped to the tenant, or `null` if it doesn't exist / isn't visible. */
export const getDepartment = cache(
  async (tenantId: string, id: string): Promise<Department | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('departments')
      .select(DEPARTMENT_COLUMNS)
      .eq('tenant_id', tenantId)
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;
    return toDepartment(data);
  },
);

/**
 * The tenant's active members, each flagged with whether they are scoped to `departmentId`.
 * Drives the department-access screen. `department_memberships` is readable to tenant members
 * under RLS; profiles of co-members are visible via `app.shares_tenant`. Sorted by name.
 */
export const getDepartmentAccess = cache(
  async (tenantId: string, departmentId: string): Promise<DepartmentMember[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('memberships')
      // `profiles!profile_id` disambiguates from the `invited_by` FK (both point at profiles).
      .select(
        'id, profiles!profile_id(full_name, email), role_definitions(key), department_memberships(department_id)',
      )
      .eq('tenant_id', tenantId)
      .eq('status', 'active');

    if (error || !data) return [];

    return data
      .map((row: Record<string, unknown>): DepartmentMember => {
        const profile = row.profiles as {
          full_name: string | null;
          email: string | null;
        } | null;
        const role = row.role_definitions as { key: string } | null;
        const links = row.department_memberships as { department_id: string }[] | null;
        const email = profile?.email ?? null;
        return {
          membershipId: row.id as string,
          name: profile?.full_name || email || 'Unknown member',
          email,
          roleKey: role?.key ?? '',
          assigned: Boolean(links?.some((l) => l.department_id === departmentId)),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  },
);
