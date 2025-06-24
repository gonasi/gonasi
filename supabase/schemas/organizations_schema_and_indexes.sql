-- ===================================================
-- TABLE: public.organizations
-- ===================================================
-- Stores organization profile data. Each row represents a unique organization.

create table public.organizations (
  id uuid primary key default uuid_generate_v4(), -- Unique organization ID

  name text not null,                             -- Name of the organization
  slug text,                                      -- URL-safe unique identifier (e.g., 'gonasi-foundation')

  avatar_url text,                                -- Optional logo or avatar image
  blur_hash text,                                 -- Optional low-res placeholder for avatar

  is_public boolean not null default false,       -- Controls public discoverability

  -- Contact & verification
  phone_number text,
  phone_number_verified boolean not null default false,
  email_verified boolean not null default false,

  -- Audit fields
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,                         -- Null = active, non-null = soft-deleted

  created_by uuid references profiles(id) on delete set null,
  updated_by uuid references profiles(id) on delete set null,
  deleted_by uuid references profiles(id) on delete set null
);

-- ===================================================
-- FUNCTION: normalize_slug(text)
-- ===================================================
-- Converts input text to a URL-safe, lowercase slug.
-- Removes special characters, trims spaces, and replaces them with hyphens.

create or replace function public.normalize_slug(input text)
  returns text
  set search_path = ''
as $$
begin
  return lower(
    regexp_replace(                               -- Step 3: remove unwanted characters
      regexp_replace(trim(input), '\s+', '-', 'g'), -- Step 1 & 2: trim + replace spaces
      '[^a-zA-Z0-9\-]', '', 'g'                   -- Step 3 continued: keep only a-z, 0-9, and -
    )
  );
end;
$$ language plpgsql;

-- ===================================================
-- FUNCTION: set_organization_slug()
-- ===================================================
-- Trigger function to normalize slug before insert or update.
-- If slug is missing, uses name as the source.

create or replace function public.set_organization_slug()
  returns trigger
  set search_path = ''
as $$
begin
  -- Default to name if slug is not provided
  if NEW.slug is null or NEW.slug = '' then
    NEW.slug := NEW.name;
  end if;

  -- Normalize it using our slug utility
  NEW.slug := normalize_slug(NEW.slug);
  return NEW;
end;
$$ language plpgsql;

-- ===================================================
-- TRIGGER: trigger_set_organization_slug
-- ===================================================
-- Automatically applies slug normalization on every insert or update.

create trigger trigger_set_organization_slug
before insert or update on public.organizations
for each row execute function set_organization_slug();

-- ===================================================
-- COMMENTS
-- ===================================================
comment on table public.organizations is 'Stores profile data for each organization in the system, including audit and soft-delete support.';
comment on column public.organizations.slug is 'URL-safe, normalized, unique identifier used in routing.';
comment on column public.organizations.deleted_at is 'Null means active. Non-null marks the row as soft-deleted.';

-- ===================================================
-- INDEXES
-- ===================================================

-- Enforce uniqueness of slug only for non-deleted orgs (allows reuse after soft delete)
create unique index idx_organizations_slug_unique
on public.organizations(slug)
where deleted_at is null;

-- Additional indexes for filtering and joins
create index idx_organizations_created_at on public.organizations(created_at);
create index idx_organizations_deleted_at on public.organizations(deleted_at);
create index idx_organizations_created_by on public.organizations(created_by);
create index idx_organizations_updated_by on public.organizations(updated_by);
create index idx_organizations_deleted_by on public.organizations(deleted_by);
