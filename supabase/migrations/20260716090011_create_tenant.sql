-- Phase 3 / 0011 — self-serve workspace creation.
-- `tenants` has no INSERT policy (deny-by-default), so onboarding goes through this
-- SECURITY DEFINER function: it creates the tenant, its settings, and an owner membership
-- for the caller, atomically. Exposed in `public` so the app can call it via rpc().

create or replace function public.create_tenant(p_name text)
returns public.tenants
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid    uuid := auth.uid();
  v_base   text;
  v_slug   text;
  v_n      int := 1;
  v_tenant public.tenants;
  v_owner  uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;
  if coalesce(trim(p_name), '') = '' then
    raise exception 'Workspace name is required' using errcode = '22023';
  end if;

  -- Slugify: lowercase, non-alphanumeric runs -> '-', trim leading/trailing '-'.
  v_base := trim(both '-' from regexp_replace(lower(trim(p_name)), '[^a-z0-9]+', '-', 'g'));
  if v_base = '' then
    v_base := 'workspace';
  end if;

  -- Ensure the slug is unique (append -2, -3, … on collision).
  v_slug := v_base;
  while exists (select 1 from public.tenants t where t.slug = v_slug) loop
    v_n := v_n + 1;
    v_slug := v_base || '-' || v_n::text;
  end loop;

  insert into public.tenants (slug, name, created_by)
  values (v_slug, trim(p_name), v_uid)
  returning * into v_tenant;

  insert into public.tenant_settings (tenant_id) values (v_tenant.id);

  select id into v_owner
  from public.role_definitions
  where key = 'owner' and tenant_id is null;

  insert into public.memberships (tenant_id, profile_id, role_id)
  values (v_tenant.id, v_uid, v_owner);

  return v_tenant;
end;
$$;

revoke all on function public.create_tenant(text) from public;
grant execute on function public.create_tenant(text) to authenticated;
