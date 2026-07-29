'use client';

import { Field } from '@/components/auth/field';
import { Label } from '@/components/ui/label';
import { SKILL_STATUS, SKILL_STATUS_LABEL, type SkillStatus } from '@/lib/skills/types';

const SELECT_CLASS =
  'flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

export interface SkillDefaults {
  name?: string;
  status?: SkillStatus;
}

interface SkillFieldsProps {
  defaults?: SkillDefaults;
  fieldErrors?: Record<string, string[] | undefined>;
  /** Render the lifecycle status control (edit only — new skills are always `active`). */
  includeStatus?: boolean;
}

/**
 * Shared skill fields used by both the add and edit forms. Presentational only — each form
 * supplies its own `<form action>` and submit button.
 */
export function SkillFields({ defaults, fieldErrors, includeStatus }: SkillFieldsProps) {
  return (
    <>
      <Field
        label="Skill name"
        name="name"
        placeholder="e.g. IV Cannulation"
        defaultValue={defaults?.name}
        autoFocus
        required
        errors={fieldErrors?.name}
      />
      {includeStatus ? (
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={defaults?.status ?? 'active'}
            className={SELECT_CLASS}
          >
            {SKILL_STATUS.map((s) => (
              <option key={s} value={s}>
                {SKILL_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Archiving hides a skill from active use without deleting it.
          </p>
        </div>
      ) : null}
    </>
  );
}
