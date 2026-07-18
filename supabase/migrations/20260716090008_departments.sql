-- Phase 2 / 0008 — departments + department_memberships. RLS enabled; policies in 0009.

create table public.departments (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants (id) on delete cascade,
  name       text not null,
  code       text,
  status     public.lifecycle_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, code)
);

create index departments_tenant_idx on public.departments (tenant_id);

create trigger departments_set_updated_at
  before update on public.departments
  for each row execute function app.set_updated_at();

-- Scopes a member to specific departments. A member with NO rows here is unrestricted
-- (sees all departments in their tenant); once scoped, they see only their linked ones.
create table public.department_memberships (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants (id) on delete cascade, -- denormalised for RLS
  department_id uuid not null references public.departments (id) on delete cascade,
  membership_id uuid not null references public.memberships (id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique (department_id, membership_id)
);

create index department_memberships_membership_idx
  on public.department_memberships (membership_id);
create index department_memberships_tenant_idx
  on public.department_memberships (tenant_id);

alter table public.departments enable row level security;
alter table public.department_memberships enable row level security;
grant select, insert, update, delete on public.departments to authenticated;
grant select, insert, update, delete on public.department_memberships to authenticated;
