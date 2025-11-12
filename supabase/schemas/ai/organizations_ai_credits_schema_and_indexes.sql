-- ============================================================
-- Organization AI Credits
-- ============================================================
create table if not exists public.organizations_ai_credits (
  org_id uuid primary key references public.organizations(id) on delete cascade,

  -- Base (tier-included) credits
  base_credits_total int not null default 100,       -- from tier_limits.ai_usage_limit_monthly
  base_credits_remaining int not null default 100,

  -- Purchased (add-on) credits
  purchased_credits_total int not null default 0,    -- lifetime purchased amount
  purchased_credits_remaining int not null default 0,

  -- Renewal tracking
  last_reset_at timestamptz not null default now(),
  next_reset_at timestamptz not null default (now() + interval '1 month'),

  -- Audit fields
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Indexes
-- ------------------------------------------------------------

-- Fast lookup by org
create index if not exists idx_organizations_ai_credits_org_id
  on public.organizations_ai_credits(org_id);

-- For scheduled resets or reports
create index if not exists idx_organizations_ai_credits_next_reset_at
  on public.organizations_ai_credits(next_reset_at);

-- ------------------------------------------------------------
-- View: Total Available Credits
-- ------------------------------------------------------------
create or replace view public.v_organizations_ai_available_credits as
select
  org_id,
  base_credits_remaining + purchased_credits_remaining as total_available_credits,
  base_credits_remaining,
  purchased_credits_remaining,
  last_reset_at,
  next_reset_at
from public.organizations_ai_credits;
