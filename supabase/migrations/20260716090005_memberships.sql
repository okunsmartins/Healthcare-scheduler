-- Phase 2 / 0005 — memberships (profile ↔ tenant ↔ role). RLS enabled; policies in 0007.

create table public.memberships (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role_id    uuid not null references public.role_definitions (id),
  status     public.membership_status not null default 'active',
  invited_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, profile_id) -- one membership per user per tenant
);

create index memberships_profile_idx on public.memberships (profile_id);
create index memberships_tenant_idx on public.memberships (tenant_id);

create trigger memberships_set_updated_at
  before update on public.memberships
  for each row execute function app.set_updated_at();

alter table public.memberships enable row level security;
grant select, insert, update, delete on public.memberships to authenticated;
