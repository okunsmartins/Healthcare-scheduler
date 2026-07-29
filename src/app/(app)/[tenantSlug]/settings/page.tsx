import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Award, Building2, ChevronRight, type LucideIcon } from 'lucide-react';
import { PageHeader, ComingSoon } from '@/components/shell/page-header';
import { resolveTenantContext } from '@/lib/tenancy';
import { canManageDepartments } from '@/lib/departments';
import { canManageSkills } from '@/lib/skills';

export const metadata: Metadata = { title: 'Settings' };

interface SettingCard {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = await resolveTenantContext(tenantSlug);
  if (!tenant) notFound();

  const cards: SettingCard[] = [];
  if (canManageDepartments(tenant.roleKey)) {
    cards.push({
      href: `/${tenantSlug}/settings/departments`,
      icon: Building2,
      title: 'Departments',
      description: 'Create and manage the departments in this workspace.',
    });
  }
  if (canManageSkills(tenant.roleKey)) {
    cards.push({
      href: `/${tenantSlug}/settings/skills`,
      icon: Award,
      title: 'Skills',
      description: 'Manage the competencies staff can hold.',
    });
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Workspace configuration, departments, skills, roles, and permissions."
      />

      {cards.length > 0 ? (
        <ul className="space-y-3">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <li
                key={card.href}
                className="rounded-lg border bg-card text-card-foreground"
              >
                <Link
                  href={card.href}
                  className="flex items-center gap-4 p-5 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-background">
                    <Icon className="h-5 w-5 text-muted-foreground" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{card.title}</span>
                    <span className="block text-sm text-muted-foreground">
                      {card.description}
                    </span>
                  </span>
                  <ChevronRight
                    className="h-5 w-5 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <ComingSoon branch="feature/department-management" />
      )}

      <p className="mt-6 text-sm text-muted-foreground">
        Roles, permissions, and workspace preferences arrive on later branches.
      </p>
    </>
  );
}
