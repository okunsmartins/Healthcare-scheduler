-- Phase 2 / 0009 — department-scoped access: helper + RLS policies.

-- True when the current user may see `target_department`: they must be a member of its
-- tenant AND either be explicitly linked to it, OR have no department links in that tenant
-- at all (unrestricted). SECURITY DEFINER so it reads scoping data without recursive RLS.
create or replace function app.is_department_member(target_department uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.departments d
    where d.id = target_department
      and app.is_member(d.tenant_id)
      and (
        exists (
          select 1
          from public.department_memberships dm
          join public.memberships m on m.id = dm.membership_id
          where dm.department_id = target_department
            and m.profile_id = auth.uid()
            and m.status = 'active'
        )
        or not exists (
          select 1
          from public.department_memberships dm
          join public.memberships m on m.id = dm.membership_id
          where dm.tenant_id = d.tenant_id
            and m.profile_id = auth.uid()
            and m.status = 'active'
        )
      )
  );
$$;

revoke all on function app.is_department_member(uuid) from public;
grant execute on function app.is_department_member(uuid) to authenticated;

-- departments: visible per department scope; managed with departments.manage.
create policy departments_select on public.departments
  for select to authenticated using (app.is_department_member(id));
create policy departments_insert on public.departments
  for insert to authenticated with check (app.has_permission(tenant_id, 'departments.manage'));
create policy departments_update on public.departments
  for update to authenticated
  using (app.is_member(tenant_id))
  with check (app.has_permission(tenant_id, 'departments.manage'));
create policy departments_delete on public.departments
  for delete to authenticated using (app.has_permission(tenant_id, 'departments.manage'));

-- department_memberships: readable to tenant members; managed with departments.manage.
create policy department_memberships_select on public.department_memberships
  for select to authenticated using (app.is_member(tenant_id));
create policy department_memberships_insert on public.department_memberships
  for insert to authenticated with check (app.has_permission(tenant_id, 'departments.manage'));
create policy department_memberships_update on public.department_memberships
  for update to authenticated
  using (app.is_member(tenant_id))
  with check (app.has_permission(tenant_id, 'departments.manage'));
create policy department_memberships_delete on public.department_memberships
  for delete to authenticated using (app.has_permission(tenant_id, 'departments.manage'));
