import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Pencil, Plus } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { resolveTenantContext } from '@/lib/tenancy';
import { canManageSkills, getSkills } from '@/lib/skills';

export const metadata: Metadata = { title: 'Skills' };

const STATUS_TONE = {
  active: 'safe',
  suspended: 'suspended',
  archived: 'archived',
} as const;

export default async function SkillsPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = await resolveTenantContext(tenantSlug);
  if (!tenant) notFound();
  // Management is owner/admin/manager (staff.manage); RLS is the authoritative check on writes.
  if (!canManageSkills(tenant.roleKey)) redirect(`/${tenantSlug}/settings`);

  const skills = await getSkills(tenant.id);

  return (
    <>
      <Link
        href={`/${tenantSlug}/settings`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to settings
      </Link>

      <div className="mb-8 mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Skills</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            The competencies staff can hold in this workspace. Assigning skills to staff
            arrives on a later branch.
          </p>
        </div>
        <Link
          href={`/${tenantSlug}/settings/skills/new`}
          className={cn(buttonVariants(), 'shrink-0')}
        >
          <Plus className="h-4 w-4" aria-hidden />
          New skill
        </Link>
      </div>

      {skills.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-card p-8 text-card-foreground">
          <p className="text-sm font-medium">No skills yet.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your first skill to start describing what staff can do.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Skill</th>
                <th className="px-4 py-3 font-medium">Staff</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {skills.map((s) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{s.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.employeeCount}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={STATUS_TONE[s.status]} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/${tenantSlug}/settings/skills/${s.id}/edit`}
                      className={cn(
                        buttonVariants({ variant: 'ghost', size: 'sm' }),
                        'text-muted-foreground',
                      )}
                      aria-label={`Edit ${s.name}`}
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
