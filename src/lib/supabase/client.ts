import { createBrowserClient } from '@supabase/ssr';
import { getClientEnv } from '@/lib/env';

/**
 * Supabase client for use in Client Components. It reads the public (anon) key only —
 * never a service-role secret — and relies on Row Level Security for authorisation.
 *
 * `createBrowserClient` returns a singleton per browser context, so calling this on each
 * render is cheap.
 */
export function createClient() {
  const env = getClientEnv();
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
