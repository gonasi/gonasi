-- Creates `public.profiles` table and core constraints.
create table public.profiles (
  id uuid primary key references auth.users(id),

  username text unique,
  email text unique not null,
  full_name text,
  avatar_url text,
  blur_hash text,

  phone_number text,
  phone_number_verified boolean not null default false,
  email_verified boolean not null default false,

  country_code char(2) default 'KE' 
    check (country_code ~* '^[A-Z]{2}$'),
  preferred_language char(2) default 'en' 
    check (preferred_language ~* '^[a-z]{2}$'),

  bio text,
  website_url text check (
    website_url ~* '^https?://[a-z0-9.-]+\.[a-z]{2,}(/.*)?$'
  ),

  is_onboarding_complete boolean not null default false,
  account_verified boolean not null default false,
  notifications_enabled boolean not null default true,

  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),

  constraint username_length check (char_length(username) >= 3),
  constraint username_lowercase check (username = lower(username)),
  constraint email_valid check (
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  )
);
