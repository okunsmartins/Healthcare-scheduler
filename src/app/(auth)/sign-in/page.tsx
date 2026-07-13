import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthCard } from '@/components/auth/auth-card';
import { SignInForm } from '@/components/auth/sign-in-form';
import { safeRedirectPath } from '@/lib/auth/routes';

export const metadata: Metadata = { title: 'Sign in' };

const ERROR_MESSAGES: Record<string, string> = {
  verification:
    'That confirmation link is invalid or has expired. Sign in, or request a new link.',
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; error?: string }>;
}) {
  const params = await searchParams;
  const redirectTo = params.redirectTo ? safeRedirectPath(params.redirectTo) : undefined;
  const initialError = params.error ? ERROR_MESSAGES[params.error] : undefined;

  return (
    <AuthCard
      title="Sign in"
      description="Welcome back. Enter your details to access your workspace."
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link
            href="/sign-up"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Create one
          </Link>
        </>
      }
    >
      <SignInForm redirectTo={redirectTo} initialError={initialError} />
    </AuthCard>
  );
}
