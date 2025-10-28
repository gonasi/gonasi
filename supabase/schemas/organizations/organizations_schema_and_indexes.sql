-- ===================================================
-- TABLE: public.organizations
-- ===================================================
-- Stores profile data for each organization in the system, including contact details,
-- visibility options, tiering info, and audit metadata.

create table public.organizations (
  id uuid primary key default uuid_generate_v4(), -- Unique ID for each organization

  -- Identity & branding
  name text not null,                             -- Full display name of the organization
  handle text unique not null,                    -- Short unique handle (e.g., 'gonasi'), used in URLs
  description text,                               -- Short bio or description of the organization
  website_url text,                               -- Optional website link

  avatar_url text,                                -- Optional image URL (logo or avatar)
  blur_hash text,                                 -- Optional low-res preview placeholder
  banner_url text,                                -- Optional cover/banner image URL
  banner_blur_hash text,                          -- Optional blur hash for banner

  -- Visibility
  is_public boolean not null default true,       -- Controls public discoverability
  is_verified boolean not null default false,     -- Verified badge or label

  -- Contact & communication
  email text,                                     -- Contact email
  phone_number text,                              -- Organization phone number
  phone_number_verified boolean not null default false,
  email_verified boolean not null default false,
  whatsapp_number text,
  location text,

  -- Tiering
  tier subscription_tier not null default 'launch' references tier_limits(tier), -- Linked to tier_limits

  -- Audit trail
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references profiles(id) on delete set null,
  owned_by   uuid references profiles(id) on delete set null,
  updated_by uuid references profiles(id) on delete set null,
  deleted_by uuid references profiles(id) on delete set null,

  -- Constraints
  constraint handle_length check (char_length(handle) >= 3),
  constraint handle_lowercase check (handle = lower(handle))
);

-- ===================================================
-- COMMENTS
-- ===================================================

comment on table public.organizations is
  'Stores profile data for each organization in the system, including contact details, visibility, and audit metadata.';

comment on column public.organizations.handle is
  'Unique handle for the organization. Validation handled at application level with Zod.';

-- ===================================================
-- INDEXES
-- ===================================================

create index idx_organizations_created_at   on public.organizations(created_at);
create index idx_organizations_created_by   on public.organizations(created_by);
create index idx_organizations_updated_by   on public.organizations(updated_by);
create index idx_organizations_deleted_by   on public.organizations(deleted_by);
create index idx_organizations_tier         on public.organizations(tier);
create index idx_organizations_owned_by     on public.organizations(owned_by);

-- ===================================================
-- TRIGGERS
-- ===================================================

-- Auto-update updated_at timestamp on row updates
create or replace trigger trg_organizations_set_updated_at
before update on public.organizations
for each row
execute function update_updated_at_column();