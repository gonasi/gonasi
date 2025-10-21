-- ============================================================
-- AI Usage Logs
-- ============================================================

create table if not exists public.ai_usage_log (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  credits_used int not null,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- Indexes
-- ------------------------------------------------------------

-- Query usage logs by organization
create index if not exists idx_ai_usage_log_org_id
  on public.ai_usage_log(org_id);

-- Query usage logs by user (e.g., per-user analytics)
create index if not exists idx_ai_usage_log_user_id
  on public.ai_usage_log(user_id);

-- Sort/filter by timestamp
create index if not exists idx_ai_usage_log_created_at
  on public.ai_usage_log(created_at desc);

-- Composite index for frequent filters (e.g. org_id + created_at)
create index if not exists idx_ai_usage_log_org_created
  on public.ai_usage_log(org_id, created_at desc);
