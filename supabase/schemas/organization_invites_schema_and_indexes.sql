-- ===================================================
-- ENUM TYPE: invite_delivery_status
-- ===================================================
-- Tracks the status of the invitation email for organization members.
-- Used for monitoring and retry logic.

create type public.invite_delivery_status as enum (
  'pending',  -- Just queued, not yet sent
  'sent',     -- Successfully delivered to the recipient
  'failed'    -- Failed after max retries or due to a fatal error
);

create table if not exists public.organization_invites (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete cascade,

  email text not null, -- Invitee's email (no user_id until accepted)

  role public.org_role not null,
  invited_by uuid not null
    references auth.users(id),

  token text not null unique, -- Secure token (rotate on resend)

  resend_count integer not null default 0,
  last_sent_at timestamptz not null default now(),

  expires_at timestamptz not null, -- Absolute expiry

  accepted_at timestamptz,
  accepted_by uuid references auth.users(id), -- Who claimed it (if any)

  revoked_at timestamptz,

  delivery_status public.invite_delivery_status not null default 'pending', -- Current delivery state of the invite
  delivery_logs jsonb not null default '[]',       -- JSON array of delivery attempts and results

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_org_invites__organization_id on public.organization_invites (organization_id);
create index if not exists idx_org_invites__token on public.organization_invites (token);
create index if not exists idx_org_invites__email on public.organization_invites (email);
create index if not exists idx_org_invites__invited_by on public.organization_invites (invited_by);
create index if not exists idx_org_invites__accepted_by on public.organization_invites (accepted_by);
create index if not exists idx_org_invites__expires_at on public.organization_invites (expires_at);

-- Only one pending invite per email per org
create unique index if not exists unique_pending_invite_per_user
on public.organization_invites (organization_id, email)
where accepted_at is null and revoked_at is null;
