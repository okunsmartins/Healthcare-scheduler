-- Phase 3 / 0013 — skills (competency catalog) + employee_skills (which staff hold them).
-- Reuses the `staff.manage` permission from 0012; no new permission.

create table public.skills (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants (id) on delete cascade,
  name       text not null,
  status     public.lifecycle_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, name)
);

create index skills_tenant_idx on public.skills (tenant_id, name);

create trigger skills_set_updated_at
  before update on public.skills
  for each row execute function app.set_updated_at();

-- Which skills an employee holds. `tenant_id` denormalised so RLS reads without extra joins.
create table public.employee_skills (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete cascade,
  skill_id    uuid not null references public.skills (id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (employee_id, skill_id)
);

create index employee_skills_employee_idx on public.employee_skills (employee_id);
create index employee_skills_skill_idx on public.employee_skills (skill_id);
create index employee_skills_tenant_idx on public.employee_skills (tenant_id);

alter table public.skills enable row level security;
alter table public.employee_skills enable row level security;
grant select, insert, update, delete on public.skills to authenticated;
grant select, insert, update, delete on public.employee_skills to authenticated;

-- Any tenant member may read the catalog/assignments; only `staff.manage` holders may write.
create policy skills_select on public.skills
  for select to authenticated using (app.is_member(tenant_id));
create policy skills_insert on public.skills
  for insert to authenticated with check (app.has_permission(tenant_id, 'staff.manage'));
create policy skills_update on public.skills
  for update to authenticated
  using (app.is_member(tenant_id))
  with check (app.has_permission(tenant_id, 'staff.manage'));
create policy skills_delete on public.skills
  for delete to authenticated using (app.has_permission(tenant_id, 'staff.manage'));

create policy employee_skills_select on public.employee_skills
  for select to authenticated using (app.is_member(tenant_id));
create policy employee_skills_insert on public.employee_skills
  for insert to authenticated with check (app.has_permission(tenant_id, 'staff.manage'));
create policy employee_skills_update on public.employee_skills
  for update to authenticated
  using (app.is_member(tenant_id))
  with check (app.has_permission(tenant_id, 'staff.manage'));
create policy employee_skills_delete on public.employee_skills
  for delete to authenticated using (app.has_permission(tenant_id, 'staff.manage'));
