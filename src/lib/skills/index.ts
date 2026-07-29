import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { Skill, SkillStatus } from './types';

export type { Skill, SkillStatus } from './types';
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
