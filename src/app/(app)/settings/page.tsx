import type { Metadata } from 'next';
import { ComingSoon, PageHeader } from '@/components/shell/page-header';

export const metadata: Metadata = { title: 'Settings' };

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Workspace configuration, departments, roles, and permissions."
      />
      <ComingSoon branch="feature/tenant-onboarding" />
    </>
  );
}
