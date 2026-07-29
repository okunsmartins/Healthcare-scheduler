import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { EditSkillForm } from '@/components/skills/edit-skill-form';
import { canManageSkills, getSkill } from '@/lib/skills';
import { resolveTenantContext } from '@/lib/tenancy';

export const metadata: Metadata = { title: 'Edit skill' };

export default async function EditSkillPage({
  params,
}: {
  params: Promise<{ tenantSlug: string; skillId: string }>;
}) {
  const { tenantSlug, skillId } = await params;
  const tenant = await resolveTenantContext(tenantSlug);
  if (!tenant) notFound();
  // Guard for non-managers; RLS is the authoritative check on the update itself.
  if (!canManageSkills(tenant.roleKey)) redirect(`/${tenantSlug}/settings`);

  const skill = await getSkill(tenant.id, skillId);
  if (!skill) notFound();

  return (
    <div className="max-w-md">
      <Link
        href={`/${tenantSlug}/settings/skills`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to skills
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">Edit skill</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Update {skill.name}, or archive it to remove it from active use.
      </p>

      <div className="mt-6 rounded-lg border bg-card p-6 text-card-foreground">
        <EditSkillForm tenantSlug={tenantSlug} skill={skill} />
      </div>
    </div>
  );
}
