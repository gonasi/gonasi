-- ============================================================================
-- TABLE: public.user_notifications
-- ============================================================================
-- PURPOSE:
--   Represents a single notification sent to a specific user. This is the
--   "finalized" notification instance with templates already rendered and
--   stored permanently.
--
--   Each row corresponds to:
--     - One user
--     - One notification type
--     - One delivery event at one point in time
--
--   NOTES:
--     - title/body are stored as final strings (NOT template keys).
--     - Data needed for rendering (variables) is stored in payload.
--     - Payload can help debug or reconstruct context later.
--     - read_at = NULL means unread.
-- ============================================================================
create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),

  -- FK: Which user will see this notification
  user_id uuid not null
    references auth.users (id) on delete cascade,

  -- ENUM: Type of notification (stable key)
  key public.user_notification_key not null,

  -- Final rendered title/body (frozen at creation time)
  title text not null,
  body text not null,

  -- JSON payload used for template variables (e.g. course_id, amount, etc.)
  payload jsonb not null default '{}'::jsonb,

  -- Delivery channels used for this instance
  delivered_in_app boolean not null default true,
  delivered_email boolean not null default false,

  -- Was an email job queued? Store job id for debugging.
  email_job_id text,  -- references pgmq job ID (string)

  -- Read tracking
  read_at timestamptz,

  -- Soft-delete for user clearing notifications
  deleted_at timestamptz,

  -- Timestamp for sorting
  created_at timestamptz not null default timezone('utc', now())
);

comment on table public.user_notifications is
  'Holds all user-specific notifications, including rendered text and delivery metadata.';


-- Fetch notifications fast by user + creation time
create index if not exists idx_user_notifications_user_created_at
  on public.user_notifications (user_id, created_at desc);

-- For unread counters
create index if not exists idx_user_notifications_unread
  on public.user_notifications (user_id)
  where read_at is null and deleted_at is null;

-- Soft delete pattern
create index if not exists idx_user_notifications_not_deleted
  on public.user_notifications (user_id)
  where deleted_at is null;
