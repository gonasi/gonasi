-- ============================================================================
-- TABLE: public.org_notification_reads
-- ============================================================================
create table if not exists public.org_notification_reads (
  id uuid primary key default gen_random_uuid(),

  notification_id uuid not null
    references public.org_notifications (id) on delete cascade,

  user_id uuid not null
    references public.profiles (id) on delete cascade,

  read_at timestamptz,

  dismissed_at timestamptz,

  unique (notification_id, user_id)
);

comment on table public.org_notification_reads is
  'Individual member read/dismiss tracking for organization notifications.';

-- Indexes
create index if not exists idx_org_notification_reads_notification
  on public.org_notification_reads (notification_id);

create index if not exists idx_org_notification_reads_user
  on public.org_notification_reads (user_id);

create index if not exists idx_org_notification_reads_unread
  on public.org_notification_reads (user_id, notification_id)
  where read_at is null;

create index if not exists idx_org_notification_reads_not_dismissed
  on public.org_notification_reads (user_id, notification_id)
  where dismissed_at is null;