import { cache } from 'react';
import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { SIGN_IN_PATH } from './routes';

/**
 * The authenticated user for the current request, or `null`. Uses `getUser()` (which
 * revalidates the JWT with Supabase) rather than `getSession()` (which trusts the cookie),
 * so this is safe to gate rendering on. Wrapped in `cache` to dedupe within one request.
 */
export const getUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/**
 * Server-side guard for authenticated areas: returns the user or redirects to sign-in.
 * Middleware already blocks unauthenticated requests to protected routes; this is
 * defence-in-depth for Server Components and a convenient way to get a guaranteed user.
 */
export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) redirect(SIGN_IN_PATH);
  return user;
}
