-- ===================================================
-- TABLE: public.organizations
-- ===================================================
-- Stores organization profile data.
-- Each row represents a unique organization that may offer courses or content on the platform.

create table public.organizations (
  id uuid primary key default uuid_generate_v4(), -- Unique ID for each organization

  name text not null,                             -- Full display name of the organization
  handle text,                                     -- Short unique handle (e.g., 'gonasi'), used in URLs

  avatar_url text,                                -- Optional image URL (logo or avatar)
  blur_hash text,                                 -- Optional low-res preview placeholder

  is_public boolean not null default false,       -- Controls public discoverability of the organization

  -- Contact & verification
  phone_number text,                              -- Optional organization contact number
  phone_number_verified boolean not null default false, -- Whether the phone number has been verified
  email_verified boolean not null default false,        -- Whether the organization's email has been verified

  -- Audit fields
  created_at timestamptz not null default timezone('utc', now()), -- Timestamp of creation
  updated_at timestamptz not null default timezone('utc', now()), -- Timestamp of last update
  deleted_at timestamptz,                         -- Soft delete marker: null = active, not null = deleted

  created_by uuid references profiles(id) on delete set null, -- User who created the org
  updated_by uuid references profiles(id) on delete set null, -- Last user to update
  deleted_by uuid references profiles(id) on delete set null  -- User who soft-deleted the org
);

-- ===================================================
-- FUNCTION: normalize_handle(text)
-- ===================================================
-- Normalizes an organization handle to a lowercase, alphanumeric string with underscores.
-- Removes all characters except a–z, A–Z, 0–9, and underscore.

create or replace function public.normalize_handle(input text)
  returns text
  set search_path = ''
as $$
begin
  return lower(
    regexp_replace(trim(input), '[^a-zA-Z0-9_]', '', 'g') -- Remove non-alphanumeric/underscore
  );
end;
$$ language plpgsql;

-- ===================================================
-- FUNCTION: set_organization_handle()
-- ===================================================
-- Trigger function to normalize the organization handle before insert or update.

create or replace function public.set_organization_handle()
  returns trigger
  set search_path = ''
as $$
begin
  -- Normalize the handle if it's present
  if NEW.handle is not null and NEW.handle <> '' then
    NEW.handle := normalize_handle(NEW.handle);
  end if;

  return NEW;
end;
$$ language plpgsql;

-- ===================================================
-- TRIGGER: trigger_set_organization_handle
-- ===================================================
-- Automatically applies handle normalization on every insert or update.

create trigger trigger_set_organization_handle
before insert or update on public.organizations
for each row execute function set_organization_handle();

-- ===================================================
-- COMMENTS
-- ===================================================

comment on table public.organizations is 'Stores profile data for each organization in the system, including contact details, visibility, and audit metadata.';
comment on column public.organizations.handle is 'Unique, URL-safe short handle for the organization (e.g., "gonasi"). Used in routing and public discovery.';
comment on column public.organizations.deleted_at is 'Null means active. Non-null marks the row as soft-deleted.';

-- ===================================================
-- INDEXES
-- ===================================================

-- Enforce uniqueness of handle only for non-deleted orgs (allows reuse after soft-delete)
create unique index idx_organizations_handle_unique
on public.organizations(handle)
where deleted_at is null;

-- Indexes to optimize filtering, sorting, and joins
create index idx_organizations_created_at on public.organizations(created_at);
create index idx_organizations_deleted_at on public.organizations(deleted_at);
create index idx_organizations_created_by on public.organizations(created_by);
create index idx_organizations_updated_by on public.organizations(updated_by);
create index idx_organizations_deleted_by on public.organizations(deleted_by);
