// @vitest-environment node
//
// The default test environment is jsdom (globals like `window` are defined), but the
// server env module deliberately refuses to load in a browser context
// (`assertServerOnly`). These tests exercise that server-only module, so they must run in
// a Node environment where `window` is undefined.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The env module caches parsed values at module scope, so each test resets the
 * module registry and restores process.env.
 */
const BASE_ENV = {
  NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
  EMAIL_PROVIDER: 'console',
  CRON_SECRET: 'a-sufficiently-long-secret',
};

describe('env validation', () => {
  const original = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...original, ...BASE_ENV };
  });

  afterEach(() => {
    process.env = original;
  });

  it('parses a valid configuration', async () => {
    const { getClientEnv, getServerEnv } = await import('./index');
    expect(getClientEnv().NEXT_PUBLIC_SUPABASE_URL).toBe('http://127.0.0.1:54321');
    expect(getServerEnv().EMAIL_PROVIDER).toBe('console');
  });

  it('rejects a non-URL public app URL', async () => {
    process.env.NEXT_PUBLIC_APP_URL = 'not-a-url';
    const { getClientEnv } = await import('./index');
    expect(() => getClientEnv()).toThrow(/Invalid public environment/);
  });

  it('requires RESEND_API_KEY when EMAIL_PROVIDER=resend', async () => {
    process.env.EMAIL_PROVIDER = 'resend';
    process.env.RESEND_API_KEY = '';
    const { getServerEnv } = await import('./index');
    expect(() => getServerEnv()).toThrow(/RESEND_API_KEY is required/);
  });

  it('rejects a too-short CRON_SECRET', async () => {
    process.env.CRON_SECRET = 'short';
    const { getServerEnv } = await import('./index');
    expect(() => getServerEnv()).toThrow(/CRON_SECRET/);
  });
});
