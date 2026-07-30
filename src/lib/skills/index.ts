import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { HeldSkill, Skill, SkillOption, SkillStatus } from './types';

export type { Skill, SkillStatus, HeldSkill, SkillOption } from './types';
export { SKILL_STATUS, SKILL_STATUS_LABEL, canManageSkills } from './types';

// Embeds a usage count via PostgREST's aggregate embedding. `employee_skills` is readable to
// any tenant member under RLS, so the count reflects everyone in the tenant who holds the skill.
const SKILL_COLUMNS = 'id, name, status, employee_skills(count)';

function toSkill(row: Record<string, unknown>): Skill {
  const links = row.employee_skills as { count: number }[] | null | undefined;
  return {
    id: row.id as string,
    name: row.name as string,
    status: row.status as SkillStatus,
    employeeCount: links?.[0]?.count ?? 0,
  };
}

/**
 * The tenant's skill catalog, read through the RLS-aware server client (a member only ever sees
 * their own tenant's skills). Sorted by name. Cached per request.
 *
 * Server-only: importing this pulls in the Supabase server client (`next/headers`). Client
 * components must import types/labels from `./types` instead.
 */
export const getSkills = cache(async (tenantId: string): Promise<Skill[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('skills')
    .select(SKILL_COLUMNS)
    .eq('tenant_id', tenantId)
    .order('name');

  if (error || !data) return [];
  return data.map(toSkill);
});

/** A single skill scoped to the tenant, or `null` if it doesn't exist / isn't visible. */
export const getSkill = cache(
  async (tenantId: string, id: string): Promise<Skill | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('skills')
      .select(SKILL_COLUMNS)
      .eq('tenant_id', tenantId)
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;
    return toSkill(data);
  },
);

/**
 * The skills an employee currently holds (name only), for the detail-view badges. Sorted by name.
 * Reads through RLS (any tenant member may see assignments). Cached per request.
 */
export const getEmployeeSkills = cache(
  async (tenantId: string, employeeId: string): Promise<HeldSkill[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('employee_skills')
      .select('skills(id, name)')
      .eq('tenant_id', tenantId)
      .eq('employee_id', employeeId);

    if (error || !data) return [];
    return data
      .map((row: Record<string, unknown>): HeldSkill | null => {
        const skill = row.skills as { id: string; name: string } | null;
        return skill ? { id: skill.id, name: skill.name } : null;
      })
      .filter((s): s is HeldSkill => s !== null)
      .sort((a, b) => a.name.localeCompare(b.name));
  },
);

/**
 * The tenant's **active** catalog skills, each flagged with whether `employeeId` holds it. Drives
 * the skill-assignment screen (archived skills can't be newly assigned). Sorted by name.
 */
export const getSkillAssignment = cache(
  async (tenantId: string, employeeId: string): Promise<SkillOption[]> => {
    const supabase = await createClient();
    const [catalog, held] = await Promise.all([
      supabase
        .from('skills')
        .select('id, name')
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .order('name'),
      supabase
        .from('employee_skills')
        .select('skill_id')
        .eq('tenant_id', tenantId)
        .eq('employee_id', employeeId),
    ]);

    if (catalog.error || !catalog.data) return [];
    const heldIds = new Set((held.data ?? []).map((row) => row.skill_id as string));
    return catalog.data.map((row): SkillOption => {
      const id = row.id as string;
      return { skillId: id, name: row.name as string, assigned: heldIds.has(id) };
    });
  },
);
