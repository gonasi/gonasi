-- ============================================================================
-- TABLE: public.user_notifications_types
-- ============================================================================
-- PURPOSE:
--   Represents the master definition of all user notification types used
--   across the platform. This table is *declarative* — each row describes:
--
--       - which notification it is (key)
--       - its category (commerce, learning, billing, social, system)
--       - whether it should send default in-app notifications
--       - whether it should send default emails
--       - human-readable title/body templates
--
--   This table acts as the source of truth for:
--     - Generating new notifications (user_notifications)
--     - User preference settings (opt-in/opt-out)
--     - UI rendering and grouping
--     - Documentation for engineering and product teams
--
--   Important Notes:
--     - Notification *behaviors* should NEVER be stored here; only metadata.
--     - Templates can use placeholders like {{course_name}} or {{amount}}.
--       The backend function (e.g. insert_user_notification) is responsible
--       for injecting variables before sending emails or storing in-app messages.
--     - Changing a template does NOT affect previously sent notifications.
--       Only future ones.
--
--   Usage:
--     - When a real event happens (purchase, invite, subscription expiring),
--       the system looks up the appropriate row by its ENUM key.
--
--       Example:
--         select * from user_notifications_types
--         where key = 'course_purchase_success';
--
--   This table should rarely change except when adding a new notification type.
-- ============================================================================
create table if not exists public.user_notifications_types (
  id uuid primary key default gen_random_uuid(),

  key public.user_notification_key not null unique,
  category public.user_notification_category not null,

  default_in_app boolean not null default true,
  default_email boolean not null default false,

  title_template text not null,
  body_template text not null,

  created_at timestamptz not null default timezone('utc', now())
);

comment on table public.user_notifications_types is
  'Master catalog of all system-defined user notification types.';
