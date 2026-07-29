'use client';

import { useActionState } from 'react';
import { updateSkillAction, type SkillFormState } from '@/lib/skills/actions';
import { SkillFields } from '@/components/skills/skill-fields';
import { FormAlert } from '@/components/auth/form-alert';
import { SubmitButton } from '@/components/auth/submit-button';
import type { Skill } from '@/lib/skills/types';

const INITIAL: SkillFormState = {};

export function EditSkillForm({
  tenantSlug,
  skill,
}: {
  tenantSlug: string;
  skill: Skill;
}) {
  const action = updateSkillAction.bind(null, tenantSlug, skill.id);
  const [state, formAction] = useActionState(action, INITIAL);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <FormAlert tone="error">{state.error}</FormAlert>
      <SkillFields
        fieldErrors={state.fieldErrors}
        includeStatus
        defaults={{ name: skill.name, status: skill.status }}
      />
      <SubmitButton className="w-full" pendingLabel="Saving…">
        Save changes
      </SubmitButton>
    </form>
  );
}
