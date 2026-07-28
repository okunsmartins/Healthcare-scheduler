-- Cross-tenant + department + audit + employee isolation test (pgTAP). Run: supabase test db
-- Proves that under RLS an authenticated user sees ONLY their own tenant's rows, only the
-- departments they are scoped to (unrestricted when they have no department links), only their
-- own tenant's audit events and employees — and that the audit trail is append-only.

begin;
select plan(36);

-- Four auth users (the trigger creates their profiles). A and B get a tenant each; C has
-- none (used to test self-serve workspace creation via create_tenant); D is a viewer of
-- Tenant A (member, but without staff.manage — used to test the employee write gate).
insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at,
                        raw_app_meta_data, raw_user_meta_data)
values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'a@isolation.test', 'x', now(), now(), now(), '{}', '{}'),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'b@isolation.test', 'x', now(), now(), now(), '{}', '{}'),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'c@isolation.test', 'x', now(), now(), now(), '{}', '{}'),
  ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'd@isolation.test', 'x', now(), now(), now(), '{}', '{}');

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
-- User D: viewer of Tenant A (a member, but the viewer role has no staff.manage).
insert into public.memberships (tenant_id, profile_id, role_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', id
from public.role_definitions where key = 'viewer' and tenant_id is null;

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

-- Audit events: two in Tenant A, one in Tenant B.
insert into public.audit_events (tenant_id, actor_id, action, entity_type) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'membership.created', 'membership'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'tenant.updated', 'tenant'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'membership.created', 'membership');

-- Employees: two in Tenant A, one in Tenant B. Explicit ids so the write-path tests below
-- can target a specific Tenant A row.
insert into public.employees (id, tenant_id, full_name, job_title) values
  ('ee111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Aoife Byrne', 'Staff Nurse'),
  ('ee222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Conor Walsh', 'Healthcare Assistant'),
  ('ee333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Niamh Kelly', 'Staff Nurse');

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
select count(*)::int as a_audit       from public.audit_events \gset
select count(*)::int as a_audit_b     from public.audit_events
  where tenant_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' \gset
select count(*)::int as a_employees   from public.employees \gset
select count(*)::int as a_employees_b from public.employees
  where tenant_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' \gset
reset role;

select is(:a_tenants,     1, 'User A sees exactly one tenant');
select is(:a_tenant_b,    0, 'User A cannot see Tenant B');
select is(:a_members,     2, 'User A sees both memberships in their tenant (A + viewer D), not Tenant B''s');
select is(:a_settings_b,  0, 'User A cannot see Tenant B settings');
select is(:a_departments, 1, 'User A (scoped to Emergency) sees exactly one department');
select is(:a_dept_ed,     1, 'User A sees their scoped department (Emergency)');
select is(:a_dept_wa,     0, 'User A does not see an unscoped department (Ward A)');
select is(:a_dept_b,      0, 'User A cannot see Tenant B departments');
select is(:a_audit,       2, 'User A (audit.view) sees their tenant''s audit events');
select is(:a_audit_b,     0, 'User A cannot see Tenant B audit events');
select is(:a_employees,   2, 'User A sees their tenant''s employees');
select is(:a_employees_b, 0, 'User A cannot see Tenant B employees');

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
select count(*)::int as b_audit       from public.audit_events \gset
select count(*)::int as b_audit_a     from public.audit_events
  where tenant_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' \gset
select count(*)::int as b_employees   from public.employees \gset
select count(*)::int as b_employees_a from public.employees
  where tenant_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' \gset
reset role;

select is(:b_tenants,     1, 'User B sees exactly one tenant');
select is(:b_tenant_a,    0, 'User B cannot see Tenant A');
select is(:b_members,     1, 'User B sees only their own membership');
select is(:b_settings_a,  0, 'User B cannot see Tenant A settings');
select is(:b_departments, 1, 'User B (unrestricted) sees their tenant department');
select is(:b_dept_a,      0, 'User B cannot see Tenant A departments');
select is(:b_audit,       1, 'User B sees their tenant''s audit event');
select is(:b_audit_a,     0, 'User B cannot see Tenant A audit events');
select is(:b_employees,   1, 'User B sees their tenant''s employee');
select is(:b_employees_a, 0, 'User B cannot see Tenant A employees');

-- The audit trail is append-only for API roles (writes go via app.log_audit / service role).
select ok(has_table_privilege('authenticated', 'public.audit_events', 'SELECT'),
  'authenticated may read the audit log');
select ok(not has_table_privilege('authenticated', 'public.audit_events', 'INSERT'),
  'authenticated may not insert audit events directly');
select ok(not has_table_privilege('authenticated', 'public.audit_events', 'UPDATE'),
  'audit events cannot be updated (append-only)');
select ok(not has_table_privilege('authenticated', 'public.audit_events', 'DELETE'),
  'audit events cannot be deleted (append-only)');

-- ===== Employee write path is gated on staff.manage =====
-- Cross-tenant: User B (owner of Tenant B) cannot modify a Tenant A employee — the update
-- policy's USING (app.is_member) hides the row, so the statement changes nothing (no error).
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222"}', true);
update public.employees set job_title = 'HACKED'
  where id = 'ee111111-1111-1111-1111-111111111111';
reset role;
select is(
  (select job_title from public.employees where id = 'ee111111-1111-1111-1111-111111111111'),
  'Staff Nurse', 'User B cannot update a Tenant A employee (cross-tenant, RLS hides the row)');

-- Within-tenant: User D is a member of Tenant A but a viewer (no staff.manage), so the
-- write policies' WITH CHECK rejects both update and insert (SQLSTATE 42501).
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-4444-444444444444"}', true);
select throws_ok(
  $$ update public.employees set job_title = 'edited'
       where id = 'ee111111-1111-1111-1111-111111111111' $$,
  '42501', NULL,
  'A viewer cannot update an employee (no staff.manage)');
select throws_ok(
  $$ insert into public.employees (tenant_id, full_name)
       values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Mallory') $$,
  '42501', NULL,
  'A viewer cannot add an employee (no staff.manage)');
-- Same viewer also lacks departments.manage, so department writes are rejected.
select throws_ok(
  $$ update public.departments set name = 'Renamed'
       where id = 'aa111111-1111-1111-1111-111111111111' $$,
  '42501', NULL,
  'A viewer cannot update a department (no departments.manage)');
select throws_ok(
  $$ insert into public.departments (tenant_id, name, code)
       values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Rogue', 'RG') $$,
  '42501', NULL,
  'A viewer cannot add a department (no departments.manage)');
-- Nor scope a member to a department (department access). Target Ward A (aa222222), which
-- User A is NOT linked to, so only the RLS check (42501) can fire, not a unique conflict.
select throws_ok(
  $$ insert into public.department_memberships (tenant_id, department_id, membership_id)
       values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
               'aa222222-2222-2222-2222-222222222222',
               (select id from public.memberships
                  where tenant_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
                    and profile_id = '11111111-1111-1111-1111-111111111111' limit 1)) $$,
  '42501', NULL,
  'A viewer cannot scope a member to a department (no departments.manage)');
reset role;

-- ===== Self-serve onboarding: User C (no memberships) creates a workspace =====
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"33333333-3333-3333-3333-333333333333"}', true);
select public.create_tenant('Acme Health');
select count(*)::int as c_tenants  from public.tenants where slug = 'acme-health' \gset
select count(*)::int as c_members  from public.memberships \gset
reset role;

select is(:c_tenants, 1, 'create_tenant: the new workspace is visible to its creator');
select is(:c_members, 1, 'create_tenant: the creator gets exactly one membership');
select is(
  (select count(*)::int from public.tenant_settings ts
     join public.tenants t on t.id = ts.tenant_id where t.slug = 'acme-health'),
  1, 'create_tenant: a tenant_settings row is created');
select is(
  (select rd.key from public.memberships m
     join public.tenants t on t.id = m.tenant_id
     join public.role_definitions rd on rd.id = m.role_id
   where t.slug = 'acme-health'),
  'owner', 'create_tenant: the creator is the owner');

select * from finish();
rollback;
