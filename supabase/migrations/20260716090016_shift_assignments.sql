-- Phase 4 / 0016 — shift assignments: which staff are booked onto a shift instance.
-- Read by any tenant member; managed by `shift.book` holders (owner/admin/manager/scheduler).

create table public.shift_assignments (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references public.tenants (id) on delete cascade,
  shift_instance_id uuid not null references public.shift_instances (id) on delete cascade,
  employee_id       uuid not null references public.employees (id) on delete cascade,
  created_at        timestamptz not null default now(),
  -- A staff member can be booked onto a given shift at most once.
  unique (shift_instance_id, employee_id)
);

create index shift_assignments_instance_idx on public.shift_assignments (shift_instance_id);
create index shift_assignments_employee_idx on public.shift_assignments (employee_id);
create index shift_assignments_tenant_idx on public.shift_assignments (tenant_id);

alter table public.shift_assignments enable row level security;
grant select, insert, delete on public.shift_assignments to authenticated;

create policy shift_assignments_select on public.shift_assignments
  for select to authenticated using (app.is_member(tenant_id));
create policy shift_assignments_insert on public.shift_assignments
  for insert to authenticated with check (app.has_permission(tenant_id, 'shift.book'));
create policy shift_assignments_delete on public.shift_assignments
  for delete to authenticated using (app.has_permission(tenant_id, 'shift.book'));
