import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { Employee, EmploymentType } from './types';

export type { Employee, EmploymentType, EmployeeStatus } from './types';
export {
  EMPLOYMENT_TYPE_LABEL,
  EMPLOYEE_STATUS,
  EMPLOYEE_STATUS_LABEL,
  canManageStaff,
} from './types';

const EMPLOYEE_COLUMNS = 'id, full_name, email, job_title, employment_type, status';

function toEmployee(row: Record<string, unknown>): Employee {
  return {
    id: row.id as string,
    fullName: row.full_name as string,
    email: (row.email as string | null) ?? null,
    jobTitle: (row.job_title as string | null) ?? null,
    employmentType: row.employment_type as EmploymentType,
    status: row.status as Employee['status'],
  };
}

/**
 * Staff records for a tenant, read through the RLS-aware server client (a member only ever
 * sees their own tenant's staff). Callers pass a `tenantId` already resolved from a verified
 * membership; RLS enforces the boundary regardless. An optional `search` filters by name
 * (case-insensitive substring). Cached per request.
 *
 * Server-only: importing this pulls in the Supabase server client (`next/headers`). Client
 * components must import types/labels from `./types` instead.
 */
export const getEmployees = cache(
  async (tenantId: string, opts?: { search?: string }): Promise<Employee[]> => {
    const supabase = await createClient();
    let query = supabase
      .from('employees')
      .select(EMPLOYEE_COLUMNS)
      .eq('tenant_id', tenantId)
      .order('full_name');

    const term = opts?.search?.trim();
    if (term) {
      // `%` escaped so a user-typed wildcard can't broaden the match; `.ilike` is parameterised.
      const escaped = term.replace(/[%_]/g, (c) => `\\${c}`);
      query = query.ilike('full_name', `%${escaped}%`);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data.map(toEmployee);
  },
);

/**
 * A single staff record scoped to the tenant, or `null` if it doesn't exist / isn't visible
 * under RLS. Used by the edit page. Cached per request.
 */
export const getEmployee = cache(
  async (tenantId: string, id: string): Promise<Employee | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('employees')
      .select(EMPLOYEE_COLUMNS)
      .eq('tenant_id', tenantId)
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;
    return toEmployee(data);
  },
);
