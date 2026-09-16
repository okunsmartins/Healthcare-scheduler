-- Phase 4 / 0014 — shift types (the catalog of shift patterns a roster is built from).
-- Read by any tenant member; managed by `roster.edit` holders (owner/admin/manager/scheduler).

create table public.shift_types (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants (id) on delete cascade,
  name       text not null,
  -- Local wall-clock start/end. end_time <= start_time means the shift crosses midnight
  -- (e.g. a night shift 20:00 → 08:00). Duration/overnight is derived in the app, not stored.
  start_time time not null,
  end_time   time not null,
  status     public.lifecycle_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, name)
);

create index shift_types_tenant_idx on public.shift_types (tenant_id, name);

create trigger shift_types_set_updated_at
  before update on public.shift_types
  for each row execute function app.set_updated_at();

alter table public.shift_types enable row level security;
grant select, insert, update, delete on public.shift_types to authenticated;

create policy shift_types_select on public.shift_types
  for select to authenticated using (app.is_member(tenant_id));
create policy shift_types_insert on public.shift_types
  for insert to authenticated with check (app.has_permission(tenant_id, 'roster.edit'));
create policy shift_types_update on public.shift_types
  for update to authenticated
  using (app.is_member(tenant_id))
  with check (app.has_permission(tenant_id, 'roster.edit'));
create policy shift_types_delete on public.shift_types
  for delete to authenticated using (app.has_permission(tenant_id, 'roster.edit'));
