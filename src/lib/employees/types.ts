// Client-safe employee types/helpers — no server-only imports, so this can be pulled into
// client components. Server-only reads (getEmployees) live in ./index.ts.

export type EmploymentType = 'permanent' | 'bank' | 'agency';

export interface Employee {
  id: string;
  fullName: string;
  email: string | null;
  jobTitle: string | null;
  employmentType: EmploymentType;
  status: 'active' | 'suspended' | 'archived';
}

/** Display labels for the employment-type enum. */
export const EMPLOYMENT_TYPE_LABEL: Record<EmploymentType, string> = {
  permanent: 'Permanent',
  bank: 'Bank',
  agency: 'Agency',
};

/** Lifecycle statuses a staff record can hold, in the order they appear in the edit form. */
export type EmployeeStatus = Employee['status'];
export const EMPLOYEE_STATUS: EmployeeStatus[] = ['active', 'suspended', 'archived'];

/** Display labels for the staff lifecycle status (archiving is the soft-delete). */
export const EMPLOYEE_STATUS_LABEL: Record<EmployeeStatus, string> = {
  active: 'Active',
  suspended: 'Suspended',
  archived: 'Archived',
};

/** Roles that may add/manage staff — mirrors the `staff.manage` grant (RLS is authoritative). */
export function canManageStaff(roleKey: string): boolean {
  return roleKey === 'owner' || roleKey === 'admin' || roleKey === 'manager';
}
