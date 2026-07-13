'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { signInAction, type AuthState } from '@/lib/auth/actions';
import { Field } from './field';
import { FormAlert } from './form-alert';
import { SubmitButton } from './submit-button';

const INITIAL: AuthState = {};

export function SignInForm({
  redirectTo,
  initialError,
}: {
  redirectTo?: string;
  initialError?: string;
}) {
  const [state, action] = useActionState(signInAction, INITIAL);
  const error = state.error ?? initialError;

  return (
    <form action={action} className="space-y-4" noValidate>
      {redirectTo ? <input type="hidden" name="redirectTo" value={redirectTo} /> : null}
      <FormAlert tone="error">{error}</FormAlert>
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
        autoComplete="current-password"
        required
        errors={state.fieldErrors?.password}
      />
      <div className="flex justify-end">
        <Link
          href="/reset-password"
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          Forgot password?
        </Link>
      </div>
      <SubmitButton className="w-full" pendingLabel="Signing in…">
        Sign in
      </SubmitButton>
    </form>
  );
}
