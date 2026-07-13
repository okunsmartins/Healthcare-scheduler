import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthCard } from '@/components/auth/auth-card';
import { SignUpForm } from '@/components/auth/sign-up-form';

export const metadata: Metadata = { title: 'Create account' };

export default function SignUpPage() {
  return (
    <AuthCard
      title="Create your account"
      description="Sign up with your work email. You'll confirm your address before signing in."
      footer={
        <>
          Already have an account?{' '}
          <Link
            href="/sign-in"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <SignUpForm />
    </AuthCard>
  );
}
