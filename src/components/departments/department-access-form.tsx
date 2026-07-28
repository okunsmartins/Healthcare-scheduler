'use client';

import { useActionState } from 'react';
import {
  setDepartmentAccessAction,
  type DepartmentFormState,
} from '@/lib/departments/actions';
import { FormAlert } from '@/components/auth/form-alert';
import { SubmitButton } from '@/components/auth/submit-button';
import type { DepartmentMember } from '@/lib/departments/types';

const INITIAL: DepartmentFormState = {};

export function DepartmentAccessForm({
  tenantSlug,
  departmentId,
  members,
}: {
  tenantSlug: string;
  departmentId: string;
  members: DepartmentMember[];
}) {
  const action = setDepartmentAccessAction.bind(null, tenantSlug, departmentId);
  const [state, formAction] = useActionState(action, INITIAL);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <FormAlert tone="error">{state.error}</FormAlert>

      <ul className="divide-y rounded-lg border">
        {members.map((m) => (
          <li key={m.membershipId}>
            <label className="flex cursor-pointer items-center gap-3 p-4 hover:bg-accent">
              <input
                type="checkbox"
                name="member"
                value={m.membershipId}
                defaultChecked={m.assigned}
                className="h-4 w-4 shrink-0 rounded border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{m.name}</span>
                {m.email ? (
                  <span className="block truncate text-xs text-muted-foreground">
                    {m.email}
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 text-xs capitalize text-muted-foreground">
                {m.roleKey}
              </span>
            </label>
          </li>
        ))}
      </ul>

      <SubmitButton className="w-full" pendingLabel="Saving…">
        Save access
      </SubmitButton>
    </form>
  );
}
