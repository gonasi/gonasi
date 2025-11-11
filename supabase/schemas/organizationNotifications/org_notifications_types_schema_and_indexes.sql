-- ============================================================================
-- TABLE: public.org_notifications_types
-- ============================================================================
create table if not exists public.org_notifications_types (
  id uuid primary key default gen_random_uuid(),

  key public.org_notification_key not null unique,
  category public.org_notification_category not null,

  default_in_app boolean not null default true,
  default_email boolean not null default false,

  visible_to_owner boolean not null default true,
  visible_to_admin boolean not null default true,
  visible_to_editor boolean not null default false,

  title_template text not null,
  body_template text not null,

  created_at timestamptz not null default timezone('utc', now())
);

comment on table public.org_notifications_types is
  'Master catalog of all organization notification types with role-based visibility rules.';