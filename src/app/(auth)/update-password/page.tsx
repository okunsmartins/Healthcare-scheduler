import type { Metadata } from 'next';
import { AuthCard } from '@/components/auth/auth-card';
import { UpdatePasswordForm } from '@/components/auth/update-password-form';

export const metadata: Metadata = { title: 'Choose a new password' };

/**
 * Reached from a password-recovery email via /auth/confirm, which establishes the recovery
 * session before redirecting here. The update action re-checks for that session.
 */
export default function UpdatePasswordPage() {
  return (
    <AuthCard
      title="Choose a new password"
      description="Enter a new password for your account."
    >
      <UpdatePasswordForm />
    </AuthCard>
  );
}
