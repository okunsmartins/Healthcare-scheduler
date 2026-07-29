'use client';

import { useActionState } from 'react';
import { addSkillAction, type SkillFormState } from '@/lib/skills/actions';
import { SkillFields } from '@/components/skills/skill-fields';
import { FormAlert } from '@/components/auth/form-alert';
import { SubmitButton } from '@/components/auth/submit-button';

const INITIAL: SkillFormState = {};

export function AddSkillForm({ tenantSlug }: { tenantSlug: string }) {
  const action = addSkillAction.bind(null, tenantSlug);
  const [state, formAction] = useActionState(action, INITIAL);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <FormAlert tone="error">{state.error}</FormAlert>
      <SkillFields fieldErrors={state.fieldErrors} />
      <SubmitButton className="w-full" pendingLabel="Creating…">
        Create skill
      </SubmitButton>
    </form>
  );
}
