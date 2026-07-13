import type { Metadata } from 'next';
import { PageHeader } from '@/components/shell/page-header';

export const metadata: Metadata = { title: 'Dashboard' };

const STATS = [
  { label: 'Open shifts', value: '—', hint: 'Awaiting rostering' },
  { label: 'Staff on today', value: '—', hint: 'Across all departments' },
  { label: 'Pending requests', value: '—', hint: 'Leave & swaps' },
  { label: 'Coverage', value: '—', hint: 'Next 7 days' },
];

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="An overview of your workspace. The tiles below are placeholders — live figures arrive as the rostering and workforce features land."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm"
          >
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{stat.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{stat.hint}</p>
          </div>
        ))}
      </div>
    </>
  );
}
