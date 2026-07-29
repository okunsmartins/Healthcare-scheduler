'use client';

import { useActionState } from 'react';
import { setEmployeeSkillsAction, type SkillFormState } from '@/lib/skills/actions';
import { FormAlert } from '@/components/auth/form-alert';
import { SubmitButton } from '@/components/auth/submit-button';
import type { SkillOption } from '@/lib/skills/types';

const INITIAL: SkillFormState = {};

export function EmployeeSkillsForm({
  tenantSlug,
  employeeId,
  options,
}: {
  tenantSlug: string;
  employeeId: string;
  options: SkillOption[];
}) {
  const action = setEmployeeSkillsAction.bind(null, tenantSlug, employeeId);
  const [state, formAction] = useActionState(action, INITIAL);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <FormAlert tone="error">{state.error}</FormAlert>

      <ul className="divide-y rounded-lg border">
        {options.map((o) => (
          <li key={o.skillId}>
            <label className="flex cursor-pointer items-center gap-3 p-4 hover:bg-accent">
              <input
                type="checkbox"
                name="skill"
                value={o.skillId}
                defaultChecked={o.assigned}
                className="h-4 w-4 shrink-0 rounded border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              <span className="min-w-0 flex-1 font-medium">{o.name}</span>
            </label>
          </li>
        ))}
      </ul>

      <SubmitButton className="w-full" pendingLabel="Saving…">
        Save skills
      </SubmitButton>
    </form>
  );
}
