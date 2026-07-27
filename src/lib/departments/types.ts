// Client-safe department types/helpers — no server-only imports, so this can be pulled into
// client components. Server-only reads (getDepartments) live in ./index.ts.

/** Department lifecycle status (shares `public.lifecycle_status` with other tenant entities). */
export type DepartmentStatus = 'active' | 'suspended' | 'archived';

export interface Department {
  id: string;
  name: string;
  code: string | null;
  status: DepartmentStatus;
  /** Count of members scoped to this department (0 = no one is restricted to it yet). */
  memberCount: number;
}

/** Lifecycle statuses in the order they appear in the edit form. */
export const DEPARTMENT_STATUS: DepartmentStatus[] = ['active', 'suspended', 'archived'];

/** Display labels for the department status (archiving is the soft-delete). */
export const DEPARTMENT_STATUS_LABEL: Record<DepartmentStatus, string> = {
  active: 'Active',
  suspended: 'Suspended',
  archived: 'Archived',
};

/**
 * Roles that may create/manage departments — mirrors the `departments.manage` grant
 * (owner + admin only; RLS is authoritative).
 */
export function canManageDepartments(roleKey: string): boolean {
  return roleKey === 'owner' || roleKey === 'admin';
}
