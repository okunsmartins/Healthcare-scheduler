'use client';

import { useActionState } from 'react';
import { createWorkspaceAction, type CreateWorkspaceState } from '@/lib/tenancy/actions';
import { Field } from '@/components/auth/field';
import { FormAlert } from '@/components/auth/form-alert';
import { SubmitButton } from '@/components/auth/submit-button';

const INITIAL: CreateWorkspaceState = {};

export function CreateWorkspaceForm() {
  const [state, action] = useActionState(createWorkspaceAction, INITIAL);

  return (
    <form action={action} className="space-y-4" noValidate>
      <FormAlert tone="error">{state.error}</FormAlert>
      <Field
        label="Workspace name"
        name="name"
        placeholder="e.g. St Mary's Hospital"
        autoComplete="organization"
        autoFocus
        required
        errors={state.fieldErrors?.name}
      />
      <p className="text-sm text-muted-foreground">
        This is the hospital, clinic, or care group you manage schedules for. You’ll be
        its owner and can invite others.
      </p>
      <SubmitButton className="w-full" pendingLabel="Creating…">
        Create workspace
      </SubmitButton>
    </form>
  );
}
