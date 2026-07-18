-- Cross-tenant isolation test (pgTAP). Run with: supabase test db
-- Proves that an authenticated user sees ONLY their own tenant's rows under RLS.

begin;
select plan(8);

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

-- ===== As User A (capture counts under RLS, then assert as superuser) =====
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111"}', true);
select count(*)::int as a_tenants     from public.tenants \gset
select count(*)::int as a_tenant_b    from public.tenants where slug = 'tenant-b' \gset
select count(*)::int as a_members     from public.memberships \gset
select count(*)::int as a_settings_b  from public.tenant_settings
  where tenant_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' \gset
reset role;

select is(:a_tenants,    1, 'User A sees exactly one tenant');
select is(:a_tenant_b,   0, 'User A cannot see Tenant B');
select is(:a_members,    1, 'User A sees only their own membership');
select is(:a_settings_b, 0, 'User A cannot see Tenant B settings');

-- ===== As User B =====
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222"}', true);
select count(*)::int as b_tenants     from public.tenants \gset
select count(*)::int as b_tenant_a    from public.tenants where slug = 'tenant-a' \gset
select count(*)::int as b_members     from public.memberships \gset
select count(*)::int as b_settings_a  from public.tenant_settings
  where tenant_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' \gset
reset role;

select is(:b_tenants,    1, 'User B sees exactly one tenant');
select is(:b_tenant_a,   0, 'User B cannot see Tenant A');
select is(:b_members,    1, 'User B sees only their own membership');
select is(:b_settings_a, 0, 'User B cannot see Tenant A settings');

select * from finish();
rollback;
