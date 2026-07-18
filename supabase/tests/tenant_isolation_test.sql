-- Cross-tenant + department isolation test (pgTAP). Run with: supabase test db
-- Proves that under RLS an authenticated user sees ONLY their own tenant's rows, and only
-- the departments they are scoped to (unrestricted when they have no department links).

begin;
select plan(14);

-- Two auth users (the trigger creates their profiles), two tenants, one membership each.
insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at,
                        raw_app_meta_data, raw_user_meta_data)
values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'a@isolation.test', 'x', now(), now(), now(), '{}', '{}'),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'b@isolation.test', 'x', now(), now(), now(), '{}', '{}');

insert into public.tenants (id, slug, name) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'tenant-a', 'Tenant A'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'tenant-b', 'Tenant B');
insert into public.tenant_settings (tenant_id) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

insert into public.memberships (tenant_id, profile_id, role_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', id
from public.role_definitions where key = 'owner' and tenant_id is null;
insert into public.memberships (tenant_id, profile_id, role_id)
select 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', id
from public.role_definitions where key = 'owner' and tenant_id is null;

-- Departments: two in Tenant A (Emergency, Ward A), one in Tenant B (Theatre).
insert into public.departments (id, tenant_id, name, code) values
  ('aa111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Emergency', 'ED'),
  ('aa222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Ward A', 'WA'),
  ('bb111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Theatre', 'TH');

-- Scope User A to Emergency only. User B is left unrestricted (no department links).
insert into public.department_memberships (tenant_id, department_id, membership_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aa111111-1111-1111-1111-111111111111', m.id
from public.memberships m
where m.tenant_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  and m.profile_id = '11111111-1111-1111-1111-111111111111';

-- ===== As User A (scoped to Emergency) =====
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111"}', true);
select count(*)::int as a_tenants     from public.tenants \gset
select count(*)::int as a_tenant_b    from public.tenants where slug = 'tenant-b' \gset
select count(*)::int as a_members     from public.memberships \gset
select count(*)::int as a_settings_b  from public.tenant_settings
  where tenant_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' \gset
select count(*)::int as a_departments from public.departments \gset
select count(*)::int as a_dept_ed     from public.departments
  where id = 'aa111111-1111-1111-1111-111111111111' \gset
select count(*)::int as a_dept_wa     from public.departments
  where id = 'aa222222-2222-2222-2222-222222222222' \gset
select count(*)::int as a_dept_b      from public.departments
  where tenant_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' \gset
reset role;

select is(:a_tenants,     1, 'User A sees exactly one tenant');
select is(:a_tenant_b,    0, 'User A cannot see Tenant B');
select is(:a_members,     1, 'User A sees only their own membership');
select is(:a_settings_b,  0, 'User A cannot see Tenant B settings');
select is(:a_departments, 1, 'User A (scoped to Emergency) sees exactly one department');
select is(:a_dept_ed,     1, 'User A sees their scoped department (Emergency)');
select is(:a_dept_wa,     0, 'User A does not see an unscoped department (Ward A)');
select is(:a_dept_b,      0, 'User A cannot see Tenant B departments');

-- ===== As User B (unrestricted) =====
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222"}', true);
select count(*)::int as b_tenants     from public.tenants \gset
select count(*)::int as b_tenant_a    from public.tenants where slug = 'tenant-a' \gset
select count(*)::int as b_members     from public.memberships \gset
select count(*)::int as b_settings_a  from public.tenant_settings
  where tenant_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' \gset
select count(*)::int as b_departments from public.departments \gset
select count(*)::int as b_dept_a      from public.departments
  where tenant_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' \gset
reset role;

select is(:b_tenants,     1, 'User B sees exactly one tenant');
select is(:b_tenant_a,    0, 'User B cannot see Tenant A');
select is(:b_members,     1, 'User B sees only their own membership');
select is(:b_settings_a,  0, 'User B cannot see Tenant A settings');
select is(:b_departments, 1, 'User B (unrestricted) sees their tenant department');
select is(:b_dept_a,      0, 'User B cannot see Tenant A departments');

select * from finish();
rollback;
