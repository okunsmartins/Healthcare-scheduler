import { NextResponse } from 'next/server';

/**
 * Liveness / readiness endpoint.
 *
 * Returns a minimal, non-sensitive payload used by uptime monitors and preview
 * smoke tests. It never leaks configuration values — it only reports whether the
 * expected variables are PRESENT, not what they contain (see OBSERVABILITY docs).
 * Deeper checks (DB connectivity, migration status) are added on later branches.
 */
export const dynamic = 'force-dynamic';

export function GET() {
  const checks = {
    supabaseUrlConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnonKeyConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    emailProviderConfigured: Boolean(process.env.EMAIL_PROVIDER),
  };

  return NextResponse.json(
    {
      status: 'ok',
      service: 'healthcare-scheduler-portal',
      version: process.env.npm_package_version ?? '0.1.0',
      timestamp: new Date().toISOString(),
      checks,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
