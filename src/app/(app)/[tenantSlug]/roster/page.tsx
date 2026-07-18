import type { Metadata } from 'next';
import { ComingSoon, PageHeader } from '@/components/shell/page-header';

export const metadata: Metadata = { title: 'Roster' };

export default function RosterPage() {
  return (
    <>
      <PageHeader
        title="Roster"
        description="Build, review, and publish rosters for each roster period."
      />
      <ComingSoon branch="feature/shift-instances" />
    </>
  );
}
