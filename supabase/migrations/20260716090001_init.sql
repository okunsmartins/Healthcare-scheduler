-- Phase 2 / 0001 — extensions, private `app` schema, shared enums, updated_at trigger fn.
-- See docs/DATA_MODEL.md.

create extension if not exists pgcrypto; -- gen_random_uuid()

-- Private schema for SECURITY DEFINER helpers. Not exposed via PostgREST.
create schema if not exists app;
grant usage on schema app to authenticated;

-- Shared enums (public so they can be referenced by table columns).
create type public.tenant_status as enum ('active', 'suspended', 'archived');
create type public.membership_status as enum ('active', 'suspended', 'invited');
create type public.lifecycle_status as enum ('active', 'suspended', 'archived');

-- Maintains updated_at on UPDATE.
create or replace function app.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
