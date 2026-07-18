-- Local development seed. Applied by `supabase db reset` / first `supabase start` on the
-- LOCAL stack only — never to a hosted project. Creates a demo user who belongs to two
-- workspaces so the workspace switcher and membership guard can be exercised.
--
-- Demo login:  demo@local.test  /  DemoPass123!

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data
)
values (
  'd0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'demo@local.test',
  crypt('DemoPass123!', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Demo User"}'
)
on conflict (id) do nothing;

insert into public.tenants (id, slug, name) values
  ('a0000000-0000-0000-0000-0000000000a1', 'st-marys', 'St Mary''s Hospital'),
  ('a0000000-0000-0000-0000-0000000000a2', 'riverside-clinic', 'Riverside Clinic')
on conflict (id) do nothing;

insert into public.tenant_settings (tenant_id) values
  ('a0000000-0000-0000-0000-0000000000a1'),
  ('a0000000-0000-0000-0000-0000000000a2')
on conflict (tenant_id) do nothing;

-- Demo user: owner of St Mary's, viewer of Riverside (to show two roles).
insert into public.memberships (tenant_id, profile_id, role_id)
select 'a0000000-0000-0000-0000-0000000000a1', 'd0000000-0000-0000-0000-000000000001', id
from public.role_definitions where key = 'owner' and tenant_id is null
on conflict (tenant_id, profile_id) do nothing;

insert into public.memberships (tenant_id, profile_id, role_id)
select 'a0000000-0000-0000-0000-0000000000a2', 'd0000000-0000-0000-0000-000000000001', id
from public.role_definitions where key = 'viewer' and tenant_id is null
on conflict (tenant_id, profile_id) do nothing;

-- Departments for the demo workspaces. The demo user is an owner (unrestricted), so no
-- department_memberships are seeded — they see all departments in each workspace.
insert into public.departments (tenant_id, name, code) values
  ('a0000000-0000-0000-0000-0000000000a1', 'Emergency', 'ED'),
  ('a0000000-0000-0000-0000-0000000000a1', 'Maternity', 'MAT'),
  ('a0000000-0000-0000-0000-0000000000a2', 'General Practice', 'GP')
on conflict (tenant_id, code) do nothing;
