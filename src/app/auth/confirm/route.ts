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
 * exchanges the one-time token for a session (setting auth cookies) and forwards the user
 * on — to `/update-password` for recovery, or the app for confirmation. On failure it
 * sends them to sign-in with an error flag rather than leaking token details.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = safeRedirectPath(searchParams.get('next'), DEFAULT_SIGNED_IN_PATH);

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  const failure = new URL(SIGN_IN_PATH, request.url);
  failure.searchParams.set('error', 'verification');
  return NextResponse.redirect(failure);
}
