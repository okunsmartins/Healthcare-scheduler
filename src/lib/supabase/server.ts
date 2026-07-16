import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getClientEnv } from '@/lib/env';

/**
 * Supabase client for Server Components, Server Actions, and Route Handlers. Sessions are
 * carried in cookies (via @supabase/ssr) rather than a client-held token, so auth state is
 * available during server rendering.
 *
 * The `setAll` write is wrapped in try/catch: cookies cannot be written from a Server
 * Component render, but that is harmless because middleware refreshes the session on every
 * request. Writes from Server Actions / Route Handlers succeed normally.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const env = getClientEnv();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component render — safe to ignore.
          }
        },
      },
    },
  );
}
