-- ============================================
-- Migration: Convert `mode` to ENUM and set `active_organization_id` to UUID
-- ============================================

-- Create the ENUM type for `mode`.
create type profile_mode as enum ('personal', 'organization');

-- Alter `mode` column to use the new ENUM type.
-- Assumes existing text values are valid ENUM variants.
alter table public.profiles
alter column mode type profile_mode using mode::profile_mode,
alter column mode set not null,
alter column mode set default 'personal';

-- Alter `active_organization_id` to UUID type.
-- Assumes a prior migration has updated all values to valid UUIDs or NULL.
alter table public.profiles
alter column active_organization_id type uuid using active_organization_id::uuid;

-- Add foreign key constraint with ON DELETE SET NULL.
alter table public.profiles
add constraint profiles_active_organization_id_fkey
foreign key (active_organization_id) references public.organizations(id)
on delete set null;

-- Add a CHECK constraint to enforce mode/organization consistency.
alter table public.profiles
add constraint mode_organization_consistency check (
  (mode = 'personal' and active_organization_id is null) or
  (mode = 'organization' and active_organization_id is not null)
);

-- Create an index on active_organization_id for join performance.
create index idx_profiles_active_organization_id
on public.profiles(active_organization_id);
