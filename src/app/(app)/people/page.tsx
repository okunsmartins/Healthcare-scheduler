import type { Metadata } from 'next';
import { ComingSoon, PageHeader } from '@/components/shell/page-header';

export const metadata: Metadata = { title: 'People' };

export default function PeoplePage() {
  return (
    <>
      <PageHeader
        title="People"
        description="Manage staff, contracts, skills, and availability across departments."
      />
      <ComingSoon branch="feature/employee-directory" />
    </>
  );
}
