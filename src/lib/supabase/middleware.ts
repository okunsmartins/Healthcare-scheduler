import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { getClientEnv } from '@/lib/env';

/**
 * Refreshes the Supabase session on every request and returns the current user plus a
 * response carrying any rotated auth cookies.
 *
 * IMPORTANT: the returned `response` cookies must be propagated to whatever response the
 * middleware ultimately returns (including redirects), or the refreshed session is lost.
 * `middleware.ts` handles that.
 */
export async function updateSession(
  request: NextRequest,
): Promise<{ response: NextResponse; user: User | null }> {
  let response = NextResponse.next({ request });
  const env = getClientEnv();

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and getUser() — it refreshes the token and
  // is what keeps the session alive.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
