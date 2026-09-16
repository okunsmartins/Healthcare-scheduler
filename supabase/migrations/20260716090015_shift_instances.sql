-- Phase 4 / 0015 — shift instances: a concrete shift on the roster (a shift type, on a date,
-- in a department, needing N staff). Staff assignment to instances is a later branch.
-- Read by any tenant member; managed by `roster.edit` holders.

create table public.shift_instances (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants (id) on delete cascade,
  department_id  uuid not null references public.departments (id) on delete cascade,
  -- Restrict: a shift type that is scheduled cannot be hard-deleted (the UI archives instead).
  shift_type_id  uuid not null references public.shift_types (id) on delete restrict,
  shift_date     date not null,
  required_staff integer not null default 1 check (required_staff > 0),
  notes          text,
  status         public.lifecycle_status not null default 'active',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  -- One instance per shift type per department per day (headcount lives in required_staff).
  unique (tenant_id, department_id, shift_date, shift_type_id)
);

create index shift_instances_tenant_date_idx on public.shift_instances (tenant_id, shift_date);
create index shift_instances_department_idx on public.shift_instances (department_id);
create index shift_instances_shift_type_idx on public.shift_instances (shift_type_id);

create trigger shift_instances_set_updated_at
  before update on public.shift_instances
  for each row execute function app.set_updated_at();

alter table public.shift_instances enable row level security;
grant select, insert, update, delete on public.shift_instances to authenticated;

create policy shift_instances_select on public.shift_instances
  for select to authenticated using (app.is_member(tenant_id));
create policy shift_instances_insert on public.shift_instances
  for insert to authenticated with check (app.has_permission(tenant_id, 'roster.edit'));
create policy shift_instances_update on public.shift_instances
  for update to authenticated
  using (app.is_member(tenant_id))
  with check (app.has_permission(tenant_id, 'roster.edit'));
create policy shift_instances_delete on public.shift_instances
  for delete to authenticated using (app.has_permission(tenant_id, 'roster.edit'));
