import type { EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  DEFAULT_SIGNED_IN_PATH,
  safeRedirectPath,
  SIGN_IN_PATH,
} from '@/lib/auth/routes';

/**
 * Handles the links Supabase emails for sign-up confirmation and password recovery. It
 * establishes a session (setting auth cookies) and forwards the user on — to
 * `/update-password` for recovery (via the preserved `next`), or the app for confirmation.
 * On failure it sends them to sign-in with an error flag rather than leaking token details.
 *
 * Two link formats are supported so this works regardless of how the Supabase project is
 * configured:
 *  - `?code=…` — the PKCE flow used by Supabase's default email templates; exchanged for a
 *    session with `exchangeCodeForSession`.
 *  - `?token_hash=…&type=…` — the token-hash flow used when the email templates are
 *    customised (requires custom SMTP); verified with `verifyOtp`.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = safeRedirectPath(searchParams.get('next'), DEFAULT_SIGNED_IN_PATH);

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  const failure = new URL(SIGN_IN_PATH, request.url);
  failure.searchParams.set('error', 'verification');
  return NextResponse.redirect(failure);
}
