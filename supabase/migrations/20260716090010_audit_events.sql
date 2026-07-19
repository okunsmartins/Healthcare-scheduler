-- Phase 2 / 0010 — append-only audit trail.

-- New permission: viewing the audit log. Granted to owner + admin (existing seed in 0004
-- only covered permissions that existed then, so this must be granted explicitly here).
insert into public.permission_definitions (key, description)
values ('audit.view', 'View the audit log');

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.role_definitions r
join public.permission_definitions p on p.key = 'audit.view'
where r.is_system and r.key in ('owner', 'admin');

create table public.audit_events (
  id          bigint generated always as identity primary key,
  tenant_id   uuid references public.tenants (id) on delete set null, -- NULL for system events
  actor_id    uuid references public.profiles (id) on delete set null,
  action      text not null,        -- e.g. 'membership.created'
  entity_type text not null,        -- e.g. 'membership'
  entity_id   uuid,
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

create index audit_events_tenant_idx on public.audit_events (tenant_id, created_at desc);

alter table public.audit_events enable row level security;

-- Append-only for API roles: readers with `audit.view` may SELECT their tenant's events;
-- NOBODY may insert/update/delete through the API. Writes go through `app.log_audit`
-- (SECURITY DEFINER) or the service role. Revoke insert/update/delete in case Supabase's
-- default privileges granted them, and never re-grant.
grant select on public.audit_events to authenticated;
revoke insert, update, delete on public.audit_events from authenticated;
revoke insert, update, delete on public.audit_events from anon;

create policy audit_events_select on public.audit_events
  for select to authenticated
  using (tenant_id is not null and app.has_permission(tenant_id, 'audit.view'));

-- No INSERT/UPDATE/DELETE policies by design → append-only, tamper-resistant.

-- Canonical writer. SECURITY DEFINER so server/trigger code can append without holding INSERT
-- rights and without RLS blocking it. Actor defaults to the current user (NULL = system).
create or replace function app.log_audit(
  p_tenant uuid,
  p_action text,
  p_entity_type text,
  p_entity_id uuid default null,
  p_metadata jsonb default '{}'
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id bigint;
begin
  insert into public.audit_events (tenant_id, actor_id, action, entity_type, entity_id, metadata)
  values (p_tenant, auth.uid(), p_action, p_entity_type, p_entity_id, coalesce(p_metadata, '{}'::jsonb))
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function app.log_audit(uuid, text, text, uuid, jsonb) from public;
grant execute on function app.log_audit(uuid, text, text, uuid, jsonb) to authenticated;
