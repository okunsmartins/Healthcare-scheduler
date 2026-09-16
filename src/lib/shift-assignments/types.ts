// Client-safe shift-assignment types/helpers — no server-only imports.
// Server-only reads (getShiftAssignmentOptions) live in ./index.ts.

/** A tenant employee on the assignment screen, flagged with whether they're booked on the shift. */
export interface AssignableStaff {
  /** The employee id (what `shift_assignments` links to). */
  employeeId: string;
  name: string;
  jobTitle: string | null;
  assigned: boolean;
}

/**
 * Roles that may book staff onto shifts — mirrors the `shift.book` grant
 * (owner + admin + manager + scheduler; RLS is authoritative).
 */
export function canAssignStaff(roleKey: string): boolean {
  return (
    roleKey === 'owner' ||
    roleKey === 'admin' ||
    roleKey === 'manager' ||
    roleKey === 'scheduler'
  );
}
