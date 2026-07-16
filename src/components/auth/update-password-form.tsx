'use client';

import { useActionState } from 'react';
import { updatePasswordAction, type AuthState } from '@/lib/auth/actions';
import { Field } from './field';
import { FormAlert } from './form-alert';
import { SubmitButton } from './submit-button';

const INITIAL: AuthState = {};

export function UpdatePasswordForm() {
  const [state, action] = useActionState(updatePasswordAction, INITIAL);

  return (
    <form action={action} className="space-y-4" noValidate>
      <FormAlert tone="error">{state.error}</FormAlert>
      <Field
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        errors={state.fieldErrors?.password}
      />
      <Field
        label="Confirm new password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        required
        errors={state.fieldErrors?.confirmPassword}
      />
      <SubmitButton className="w-full" pendingLabel="Updating…">
        Update password
      </SubmitButton>
    </form>
  );
}
