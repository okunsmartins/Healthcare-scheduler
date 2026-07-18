-- Phase 2 / 0007 — member/permission RLS policies (helpers + memberships now exist).

-- profiles: replace bare self-select with self-or-co-member visibility.
drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or app.shares_tenant(id));

-- tenants
create policy tenants_select on public.tenants
  for select to authenticated using (app.is_member(id));
create policy tenants_update on public.tenants
  for update to authenticated
  using (app.is_member(id)) with check (app.has_permission(id, 'tenant.manage'));

-- tenant_settings
create policy tenant_settings_select on public.tenant_settings
  for select to authenticated using (app.is_member(tenant_id));
create policy tenant_settings_update on public.tenant_settings
  for update to authenticated
  using (app.is_member(tenant_id)) with check (app.has_permission(tenant_id, 'tenant.manage'));

-- memberships
create policy memberships_select on public.memberships
  for select to authenticated using (app.is_member(tenant_id));
create policy memberships_insert on public.memberships
  for insert to authenticated with check (app.has_permission(tenant_id, 'members.manage'));
create policy memberships_update on public.memberships
  for update to authenticated
  using (app.is_member(tenant_id)) with check (app.has_permission(tenant_id, 'members.manage'));
create policy memberships_delete on public.memberships
  for delete to authenticated using (app.has_permission(tenant_id, 'members.manage'));
