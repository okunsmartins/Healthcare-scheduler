// Client-safe skill types/helpers — no server-only imports, so this can be pulled into client
// components. Server-only reads (getSkills) live in ./index.ts.

/** Skill lifecycle status (shares `public.lifecycle_status` with other tenant entities). */
export type SkillStatus = 'active' | 'suspended' | 'archived';

export interface Skill {
  id: string;
  name: string;
  status: SkillStatus;
  /** How many staff hold this skill (0 = unused). */
  employeeCount: number;
}

/** Lifecycle statuses in the order they appear in the edit form. */
export const SKILL_STATUS: SkillStatus[] = ['active', 'suspended', 'archived'];

/** Display labels for the skill status (archiving is the soft-delete). */
export const SKILL_STATUS_LABEL: Record<SkillStatus, string> = {
  active: 'Active',
  suspended: 'Suspended',
  archived: 'Archived',
};

/**
 * Roles that may manage the skill catalog and staff skill assignments — mirrors the
 * `staff.manage` grant (owner + admin + manager; RLS is authoritative).
 */
export function canManageSkills(roleKey: string): boolean {
  return roleKey === 'owner' || roleKey === 'admin' || roleKey === 'manager';
}
