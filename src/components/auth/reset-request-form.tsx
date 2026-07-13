'use client';

import { useActionState } from 'react';
import { requestResetAction, type AuthState } from '@/lib/auth/actions';
import { Field } from './field';
import { FormAlert } from './form-alert';
import { SubmitButton } from './submit-button';

const INITIAL: AuthState = {};

export function ResetRequestForm() {
  const [state, action] = useActionState(requestResetAction, INITIAL);

  if (state.message) {
    return <FormAlert tone="success">{state.message}</FormAlert>;
  }

  return (
    <form action={action} className="space-y-4" noValidate>
      <FormAlert tone="error">{state.error}</FormAlert>
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        errors={state.fieldErrors?.email}
      />
      <SubmitButton className="w-full" pendingLabel="Sending link…">
        Send reset link
      </SubmitButton>
    </form>
  );
}
