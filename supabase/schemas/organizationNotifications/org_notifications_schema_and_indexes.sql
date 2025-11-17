-- ============================================================================
-- TABLE: public.org_notifications
-- ============================================================================
create table if not exists public.org_notifications (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations (id) on delete cascade,

  key public.org_notification_key not null,

  title text not null,
  body text not null,

  link text,

  performed_by uuid null
    references public.profiles (id) on delete cascade,

  payload jsonb not null default '{}'::jsonb,

  delivered_in_app boolean not null default true,
  delivered_email boolean not null default false,

  email_job_id text,

  deleted_at timestamptz,

  created_at timestamptz not null default timezone('utc', now())
);

comment on table public.org_notifications is
  'Holds all organization-level notifications. Member visibility controlled via org_notification_reads and role-based rules.';

-- Indexes
create index if not exists idx_org_notifications_org_created
  on public.org_notifications (organization_id, created_at desc);

create index if not exists idx_org_notifications_not_deleted
  on public.org_notifications (organization_id)
  where deleted_at is null;

create index if not exists idx_org_notifications_key
  on public.org_notifications (key);