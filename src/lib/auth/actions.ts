'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getClientEnv } from '@/lib/env';
import {
  requestResetSchema,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
} from './schemas';
import { safeRedirectPath, SIGN_IN_PATH } from './routes';

/**
 * Shape returned by every auth action, consumed by the client forms via `useActionState`.
 * On success an action either redirects (sign-in, update-password) or returns a `message`
 * to display (sign-up, reset — which must not reveal whether an account exists).
 */
export interface AuthState {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  message?: string;
}

function appUrl(): string {
  return getClientEnv().NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
}

export async function signInAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    // Deliberately generic: do not reveal whether the email exists or the password was
    // wrong, and do not distinguish "email not confirmed" here.
    return { error: 'Invalid email or password.' };
  }

  revalidatePath('/', 'layout');
  redirect(safeRedirectPath(formData.get('redirectTo')?.toString()));
}

export async function signUpAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { emailRedirectTo: `${appUrl()}/auth/confirm` },
  });
  if (error) {
    return { error: 'Could not create your account. Please try again.' };
  }

  return {
    message:
      'Check your email to confirm your account. The link will bring you back to sign in.',
  };
}

export async function requestResetAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = requestResetSchema.safeParse({ email: formData.get('email') });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  // Ignore the result: a generic message avoids leaking which addresses are registered.
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${appUrl()}/auth/confirm?next=/update-password`,
  });

  return {
    message:
      'If an account exists for that email, we have sent a link to reset your password.',
  };
}

export async function updatePasswordAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = updatePasswordSchema.safeParse({
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  // Requires the recovery session established by /auth/confirm?type=recovery.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      error: 'Your reset link has expired. Please request a new one.',
    };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { error: 'Could not update your password. Please try again.' };
  }

  revalidatePath('/', 'layout');
  redirect(safeRedirectPath(null));
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect(SIGN_IN_PATH);
}
