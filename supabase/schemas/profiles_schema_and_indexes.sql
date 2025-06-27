-- ===================================================
-- TABLE: public.profiles
-- ===================================================
-- Stores user profile data associated with Supabase Auth.
-- Each row represents a unique user in the system.
create table public.profiles (
  -- Primary Key: Supabase Auth user ID
  id uuid primary key references auth.users(id),

  -- Unique username used within the app
  username text unique,

  -- Email used for account verification and login
  email text unique not null,

  -- Personal identity information
  full_name text,               -- Full name of the user
  avatar_url text,              -- URL to user's profile image
  blur_hash text null,          -- Low-res image placeholder for avatar

  -- Contact details and verification flags
  phone_number text,            -- Optional phone number
  phone_number_verified boolean not null default false,  -- Whether the phone is verified
  email_verified boolean not null default false,         -- Whether the email is verified

  is_public boolean not null default true,

  -- User's location and language preferences
  country_code char(2) default 'KE' 
    check (country_code ~* '^[A-Z]{2}$'),  -- ISO 3166-1 alpha-2 country code (e.g., US, KE)

  preferred_language char(2) default 'en' 
    check (preferred_language ~* '^[a-z]{2}$'), -- ISO 639-1 language code (e.g., en, sw)

  account_verified boolean not null default false,        -- Manual/auto verification flag
  notifications_enabled boolean not null default true,    -- Whether notifications are enabled

  mode text,  -- we run a separate migration to update mode and correct types
  active_organization_id text, -- we run a separate migration to update active_organization_id and correct types

  -- Record timestamps
  created_at timestamp with time zone not null default timezone('utc', now()), -- Creation time
  updated_at timestamp with time zone not null default timezone('utc', now()), -- Last update

  -- Additional constraints for data integrity
  constraint username_length check (char_length(username) >= 3),
  constraint username_lowercase check (username = lower(username)),
  constraint email_valid check (
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  )
);

-- Table-level comment
comment on table public.profiles is 'Stores profile data for each user, linked to Supabase Auth.';
comment on column public.profiles.id is 'References the Supabase Auth user ID.';
comment on column public.profiles.country_code is 'ISO 3166-1 alpha-2 country code (e.g., US, KE).';
comment on column public.profiles.preferred_language is 'ISO 639-1 two-letter language code (e.g., en, sw).';

-- Indexes for performance and filtering
create index idx_profiles_username on public.profiles(username) where username is not null;
create index idx_profiles_email on public.profiles(email);
create index idx_profiles_country_code on public.profiles(country_code);
create index idx_profiles_created_at on public.profiles(created_at);

-- Optimized filtering for verified user lists
create index idx_profiles_verified_users 
  on public.profiles(id) 
  where account_verified = true;