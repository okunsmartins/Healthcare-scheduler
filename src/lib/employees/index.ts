import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { Employee, EmploymentType } from './types';

export type { Employee, EmploymentType } from './types';
export { EMPLOYMENT_TYPE_LABEL, canManageStaff } from './types';

/**
 * Staff records for a tenant, read through the RLS-aware server client (a member only ever
 * sees their own tenant's staff). Callers pass a `tenantId` already resolved from a verified
 * membership; RLS enforces the boundary regardless. Cached per request.
 *
 * Server-only: importing this pulls in the Supabase server client (`next/headers`). Client
 * components must import types/labels from `./types` instead.
 */
export const getEmployees = cache(async (tenantId: string): Promise<Employee[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('employees')
    .select('id, full_name, email, job_title, employment_type, status')
    .eq('tenant_id', tenantId)
    .order('full_name');

  if (error || !data) return [];

  return data.map((row): Employee => ({
    id: row.id as string,
    fullName: row.full_name as string,
    email: (row.email as string | null) ?? null,
    jobTitle: (row.job_title as string | null) ?? null,
    employmentType: row.employment_type as EmploymentType,
    status: row.status as Employee['status'],
  }));
});
