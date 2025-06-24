-- ============================================
-- Migration: Add `mode` and `active_organization_id` to profiles using ENUM
-- ============================================

-- Create the ENUM type to replace the text column with check constraint.
-- This makes type inference and validation more robust.
create type profile_mode as enum ('personal', 'organization');

-- Add `mode` column using the new enum type with a default value.
-- ENUM types are stored more efficiently and give us automatic type safety.
alter table public.profiles
add column mode profile_mode not null default 'personal';

-- Add `active_organization_id` column as a nullable UUID foreign key
-- referencing the organizations table.
-- We use `on delete set null` so that if the organization is deleted,
-- the profile is reverted to personal mode (enforced later by a check).
alter table public.profiles
add column active_organization_id uuid
  references public.organizations(id)
  on delete set null;

-- Add a CHECK constraint to ensure consistency between the `mode`
-- and the presence of an `active_organization_id`.
-- - If mode is 'personal' then active_organization_id must be NULL.
-- - If mode is 'organization' then active_organization_id must NOT be NULL.
alter table public.profiles
add constraint mode_organization_consistency check (
  (mode = 'personal' and active_organization_id is null) or
  (mode = 'organization' and active_organization_id is not null)
);

-- Add a covering index on the foreign key column.
-- This improves join performance and helps enforce referential integrity.
create index idx_profiles_active_organization_id
on public.profiles(active_organization_id);
