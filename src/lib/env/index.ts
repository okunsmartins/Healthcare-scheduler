/**
 * Environment-variable validation.
 *
 * Two schemas keep the security boundary explicit:
 *  - `clientEnv`  — only NEXT_PUBLIC_* values; safe to import anywhere.
 *  - `serverEnv`  — server-only secrets; importing this from a client component
 *    is a build error because it reads variables that are never inlined into the
 *    browser bundle, and it is guarded at runtime by `assertServerOnly()`.
 *
 * Validation runs the first time each schema is accessed. Invalid configuration
 * throws immediately with a readable message (fail fast — see SECURITY_MODEL.md).
 */
import { z } from 'zod';

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  EMAIL_PROVIDER: z.enum(['console', 'resend']).default('console'),
  RESEND_API_KEY: z.string().optional().default(''),
  SENTRY_DSN: z.string().optional().default(''),
  CRON_SECRET: z.string().min(16, 'CRON_SECRET must be at least 16 characters'),
});

export type ClientEnv = z.infer<typeof clientSchema>;
export type ServerEnv = z.infer<typeof serverSchema>;

function format(error: z.ZodError): string {
  return error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
}

/**
 * NEXT_PUBLIC_* variables must be referenced by their full static name so that
 * Next.js can inline them into the client bundle at build time.
 */
function readClientEnv(): ClientEnv {
  const parsed = clientSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });
  if (!parsed.success) {
    throw new Error(`Invalid public environment configuration:\n${format(parsed.error)}`);
  }
  return parsed.data;
}

function readServerEnv(): ServerEnv {
  const parsed = serverSchema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    EMAIL_PROVIDER: process.env.EMAIL_PROVIDER,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    SENTRY_DSN: process.env.SENTRY_DSN,
    CRON_SECRET: process.env.CRON_SECRET,
  });
  if (!parsed.success) {
    throw new Error(`Invalid server environment configuration:\n${format(parsed.error)}`);
  }
  // Cross-field rule: Resend requires an API key.
  if (parsed.data.EMAIL_PROVIDER === 'resend' && !parsed.data.RESEND_API_KEY) {
    throw new Error(
      'Invalid server environment configuration:\n  - RESEND_API_KEY is required when EMAIL_PROVIDER=resend',
    );
  }
  return parsed.data;
}

/** Throws if server-only configuration is read from a browser context. */
export function assertServerOnly(): void {
  if (typeof window !== 'undefined') {
    throw new Error(
      'serverEnv was accessed in a browser context. Server-only secrets must ' +
        'never reach client code.',
    );
  }
}

let cachedClient: ClientEnv | null = null;
let cachedServer: ServerEnv | null = null;

export function getClientEnv(): ClientEnv {
  cachedClient ??= readClientEnv();
  return cachedClient;
}

export function getServerEnv(): ServerEnv {
  assertServerOnly();
  cachedServer ??= readServerEnv();
  return cachedServer;
}
