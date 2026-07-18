-- Phase 2 / 0006 — SECURITY DEFINER membership/permission helpers in schema `app`.
-- Definer-owned so they read membership data WITHOUT triggering RLS (no recursion).
-- search_path pinned to '' so every reference must be schema-qualified.

create or replace function app.is_member(target_tenant uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.memberships m
    where m.tenant_id = target_tenant
      and m.profile_id = auth.uid()
      and m.status = 'active'
  );
$$;

create or replace function app.has_permission(target_tenant uuid, perm text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships m
    join public.role_permissions rp on rp.role_id = m.role_id
    join public.permission_definitions p on p.id = rp.permission_id
    where m.tenant_id = target_tenant
      and m.profile_id = auth.uid()
      and m.status = 'active'
      and p.key = perm
  );
$$;

create or replace function app.shares_tenant(target_profile uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships me
    join public.memberships them on them.tenant_id = me.tenant_id
    where me.profile_id = auth.uid() and me.status = 'active'
      and them.profile_id = target_profile and them.status = 'active'
  );
$$;

revoke all on function app.is_member(uuid) from public;
revoke all on function app.has_permission(uuid, text) from public;
revoke all on function app.shares_tenant(uuid) from public;
grant execute on function app.is_member(uuid) to authenticated;
grant execute on function app.has_permission(uuid, text) to authenticated;
grant execute on function app.shares_tenant(uuid) to authenticated;
