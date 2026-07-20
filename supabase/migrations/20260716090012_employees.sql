-- Phase 3 / 0012 — employee directory (staff records).

create type public.employment_type as enum ('permanent', 'bank', 'agency');

-- New permission: add/manage staff. Granted to owner + admin + manager.
insert into public.permission_definitions (key, description)
values ('staff.manage', 'Add and manage staff');

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.role_definitions r
join public.permission_definitions p on p.key = 'staff.manage'
where r.is_system and r.key in ('owner', 'admin', 'manager');

create table public.employees (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants (id) on delete cascade,
  full_name       text not null,
  email           text,
  job_title       text,
  employment_type public.employment_type not null default 'permanent',
  status          public.lifecycle_status not null default 'active',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index employees_tenant_idx on public.employees (tenant_id, full_name);

create trigger employees_set_updated_at
  before update on public.employees
  for each row execute function app.set_updated_at();

alter table public.employees enable row level security;
grant select, insert, update, delete on public.employees to authenticated;

-- Any tenant member may read the directory; only `staff.manage` holders may write.
create policy employees_select on public.employees
  for select to authenticated using (app.is_member(tenant_id));
create policy employees_insert on public.employees
  for insert to authenticated with check (app.has_permission(tenant_id, 'staff.manage'));
create policy employees_update on public.employees
  for update to authenticated
  using (app.is_member(tenant_id))
  with check (app.has_permission(tenant_id, 'staff.manage'));
create policy employees_delete on public.employees
  for delete to authenticated using (app.has_permission(tenant_id, 'staff.manage'));
