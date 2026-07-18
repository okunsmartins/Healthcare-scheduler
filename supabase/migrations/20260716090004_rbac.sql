-- Phase 2 / 0004 — RBAC catalog (permissions, roles, grants) + system seed.

create table public.permission_definitions (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique,
  description text not null
);

create table public.role_definitions (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid references public.tenants (id) on delete cascade, -- NULL = system role
  key        text not null,
  name       text not null,
  is_system  boolean not null default false,
  created_at timestamptz not null default now()
);

-- System role keys unique globally; custom (per-tenant) role keys unique within a tenant.
create unique index role_definitions_system_key_uidx
  on public.role_definitions (key) where tenant_id is null;
create unique index role_definitions_tenant_key_uidx
  on public.role_definitions (tenant_id, key) where tenant_id is not null;

create table public.role_permissions (
  role_id       uuid not null references public.role_definitions (id) on delete cascade,
  permission_id uuid not null references public.permission_definitions (id) on delete cascade,
  primary key (role_id, permission_id)
);

-- The catalog is readable by any authenticated user; only service_role writes it.
alter table public.permission_definitions enable row level security;
alter table public.role_definitions enable row level security;
alter table public.role_permissions enable row level security;
grant select on public.permission_definitions to authenticated;
grant select on public.role_definitions to authenticated;
grant select on public.role_permissions to authenticated;

create policy permission_definitions_read on public.permission_definitions
  for select to authenticated using (true);
create policy role_definitions_read on public.role_definitions
  for select to authenticated using (true);
create policy role_permissions_read on public.role_permissions
  for select to authenticated using (true);

-- Seed system permissions.
insert into public.permission_definitions (key, description) values
  ('tenant.manage',      'Manage tenant settings'),
  ('members.manage',     'Invite and manage members and their roles'),
  ('departments.manage', 'Create and manage departments'),
  ('roster.view',        'View rosters'),
  ('roster.edit',        'Create and edit rosters and shifts'),
  ('shift.book',         'Book staff into shifts'),
  ('reports.view',       'View reports');

-- Seed system roles.
insert into public.role_definitions (key, name, is_system) values
  ('owner',     'Owner',         true),
  ('admin',     'Administrator', true),
  ('manager',   'Manager',       true),
  ('scheduler', 'Scheduler',     true),
  ('viewer',    'Viewer',        true);

-- Grant permissions to system roles. Owner gets everything.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.role_definitions r
join public.permission_definitions p
  on r.key = 'owner'
  or (r.key = 'admin'     and p.key in ('members.manage','departments.manage','roster.view','roster.edit','shift.book','reports.view'))
  or (r.key = 'manager'   and p.key in ('roster.view','roster.edit','shift.book','reports.view'))
  or (r.key = 'scheduler' and p.key in ('roster.view','roster.edit','shift.book'))
  or (r.key = 'viewer'    and p.key in ('roster.view','reports.view'))
where r.is_system;
