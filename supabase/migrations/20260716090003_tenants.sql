-- Phase 2 / 0003 — tenants + tenant_settings. RLS enabled deny-by-default;
-- member policies are added in 0007 (they depend on the helpers from 0006).

create table public.tenants (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  name       text not null,
  timezone   text not null default 'Europe/Dublin', -- IANA
  status     public.tenant_status not null default 'active',
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tenants_set_updated_at
  before update on public.tenants
  for each row execute function app.set_updated_at();

create table public.tenant_settings (
  tenant_id          uuid primary key references public.tenants (id) on delete cascade,
  locale             text not null default 'en-IE',
  timesheets_enabled boolean not null default false,
  messaging_enabled  boolean not null default false,
  updated_at         timestamptz not null default now()
);

create trigger tenant_settings_set_updated_at
  before update on public.tenant_settings
  for each row execute function app.set_updated_at();

alter table public.tenants enable row level security;
alter table public.tenant_settings enable row level security;

-- Table grants; RLS gates rows. No INSERT policy yet -> only service_role can create tenants
-- (tenant onboarding lands in Phase 3). SELECT/UPDATE policies arrive in 0007.
grant select, update on public.tenants to authenticated;
grant select, update on public.tenant_settings to authenticated;
