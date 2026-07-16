'use client';

import { useActionState } from 'react';
import { signUpAction, type AuthState } from '@/lib/auth/actions';
import { Field } from './field';
import { FormAlert } from './form-alert';
import { SubmitButton } from './submit-button';

const INITIAL: AuthState = {};

export function SignUpForm() {
  const [state, action] = useActionState(signUpAction, INITIAL);

  // On success the action returns a "check your email" message; the form is no longer
  // useful, so we replace it with the confirmation.
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
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        errors={state.fieldErrors?.password}
      />
      <p className="text-xs text-muted-foreground">At least 8 characters.</p>
      <SubmitButton className="w-full" pendingLabel="Creating account…">
        Create account
      </SubmitButton>
    </form>
  );
}
