-- ======================================================================
-- TABLE: failed_downgrade_attempts
-- Tracks failed automated downgrade executions for manual intervention
-- ======================================================================

create table public.failed_downgrade_attempts (
  -- Primary Key
  id uuid primary key default uuid_generate_v4(),

  -- Organization Reference
  organization_id uuid not null
    references public.organizations(id)
    on delete cascade,

  -- Failure Classification
  failure_type text not null check (
    failure_type in (
      'processing_error',        -- General processing failure
      'db_update_failed',        -- Paystack succeeded but DB update failed (critical!)
      'paystack_disable_failed', -- Could not disable old subscription
      'paystack_create_failed',  -- Could not create new subscription
      'rollback_failed',         -- Rollback attempt failed after creation failure
      'validation_error'         -- Pre-processing validation failed
    )
  ),

  -- Failure Details
  metadata jsonb not null default '{}'::jsonb,
  -- Expected metadata structure:
  -- {
  --   "error": "Error message",
  --   "disabled_old": true/false,
  --   "created_new": true/false,
  --   "old_subscription_code": "SUB_xxx",
  --   "new_subscription_code": "SUB_yyy",
  --   "target_tier": "starter",
  --   "current_tier": "pro",
  --   "stack_trace": "..."
  -- }

  -- Timing
  attempted_at timestamptz not null default timezone('utc', now()),
  
  -- Resolution Tracking
  resolved_at timestamptz default null,
  resolved_by uuid references auth.users(id) on delete set null,
  resolution_notes text default null,
  resolution_action text check (
    resolution_action is null or
    resolution_action in (
      'manual_sync',           -- Manually synced Paystack and DB
      'paystack_refund',       -- Refunded duplicate charge
      'retry_succeeded',       -- Automated retry succeeded
      'customer_contacted',    -- Escalated to customer support
      'no_action_needed'       -- Issue self-resolved
    )
  ),

  -- Retry Tracking
  retry_count int not null default 0,
  last_retry_at timestamptz default null,
  next_retry_at timestamptz default null,

  -- Severity Level (for alerting)
  severity text not null default 'medium' check (
    severity in ('low', 'medium', 'high', 'critical')
  ),

  -- Audit
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- ======================================================================
-- INDEXES
-- ======================================================================

-- Find all failures for an organization
create index idx_failed_downgrades_org_id
  on public.failed_downgrade_attempts (organization_id);

-- Find unresolved failures (for admin dashboard)
create index idx_failed_downgrades_unresolved
  on public.failed_downgrade_attempts (attempted_at desc)
  where resolved_at is null;

-- Find failures by type (for analytics)
create index idx_failed_downgrades_type
  on public.failed_downgrade_attempts (failure_type);

-- Find failures by severity (for alerting)
create index idx_failed_downgrades_severity
  on public.failed_downgrade_attempts (severity, attempted_at desc)
  where resolved_at is null;

-- Find failures pending retry
create index idx_failed_downgrades_retry
  on public.failed_downgrade_attempts (next_retry_at)
  where next_retry_at is not null and resolved_at is null;

-- Find critical unresolved failures (for urgent alerts)
create index idx_failed_downgrades_critical
  on public.failed_downgrade_attempts (attempted_at desc)
  where severity = 'critical' and resolved_at is null;

-- ======================================================================
-- ROW LEVEL SECURITY (RLS)
-- ======================================================================

alter table public.failed_downgrade_attempts enable row level security;

-- Only service role can insert (automated systems)
create policy "Service role can insert failed attempts"
  on public.failed_downgrade_attempts
  for insert
  to service_role
  with check (true);


-- Super admins can view all failures (optional)
create policy "Super admins can view all failed attempts"
  on public.failed_downgrade_attempts
  for select
  using (
    authorize('go_su_read')
  );

-- Only super admins and service role can update (resolve) failures
create policy "Super admins can resolve failed attempts"
  on public.failed_downgrade_attempts
  for update
  using (
    authorize('go_su_update')
  );

-- ======================================================================
-- TRIGGERS
-- ======================================================================

-- Auto-update updated_at timestamp
create trigger set_failed_downgrades_updated_at
  before update on public.failed_downgrade_attempts
  for each row
  execute function public.update_updated_at_column();


-- ======================================================================
-- HELPER FUNCTIONS
-- ======================================================================

-- Function to log failed downgrade attempts (called from Edge Function)
-- Function to log failed downgrade attempts
create or replace function public.log_failed_downgrade(
  p_organization_id uuid,
  p_failure_type text,
  p_metadata jsonb,
  p_severity text default 'medium'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempt_id uuid;
begin
  insert into public.failed_downgrade_attempts (
    organization_id,
    failure_type,
    metadata,
    severity
  )
  values (
    p_organization_id,
    p_failure_type,
    p_metadata,
    p_severity
  )
  returning id into v_attempt_id;

  -- Log critical failures to a monitoring table or send alert
  if p_severity = 'critical' then
    perform pg_notify(
      'critical_downgrade_failure',
      json_build_object(
        'organization_id', p_organization_id,
        'failure_type', p_failure_type,
        'attempt_id', v_attempt_id
      )::text
    );
  end if;

  return v_attempt_id;
end;
$$;

-- Function to resolve a failed downgrade attempt
create or replace function public.resolve_failed_downgrade(
  p_attempt_id uuid,
  p_resolution_action text,
  p_resolution_notes text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.failed_downgrade_attempts
  set
    resolved_at = timezone('utc', now()),
    resolved_by = auth.uid(),
    resolution_action = p_resolution_action,
    resolution_notes = p_resolution_notes,
    updated_at = timezone('utc', now())
  where id = p_attempt_id;

  if not found then
    raise exception 'Failed downgrade attempt not found: %', p_attempt_id;
  end if;
end;
$$;

-- Function to schedule retry for failed downgrade
create or replace function public.schedule_downgrade_retry(
  p_attempt_id uuid,
  p_retry_delay_minutes int default 60
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.failed_downgrade_attempts
  set
    retry_count = retry_count + 1,
    last_retry_at = timezone('utc', now()),
    next_retry_at = timezone('utc', now()) + (p_retry_delay_minutes || ' minutes')::interval,
    updated_at = timezone('utc', now())
  where id = p_attempt_id;

  if not found then
    raise exception 'Failed downgrade attempt not found: %', p_attempt_id;
  end if;
end;
$$;

-- -- ======================================================================
-- -- VIEWS FOR MONITORING
-- -- ======================================================================

-- -- View: Unresolved failures grouped by type
-- create or replace view public.failed_downgrades_summary as
-- select
--   failure_type,
--   severity,
--   count(*) as failure_count,
--   min(attempted_at) as oldest_failure,
--   max(attempted_at) as latest_failure,
--   count(*) filter (where severity = 'critical') as critical_count
-- from public.failed_downgrade_attempts
-- where resolved_at is null
-- group by failure_type, severity
-- order by critical_count desc, failure_count desc;

-- -- View: Recent unresolved failures (for dashboard)
-- create or replace view public.recent_failed_downgrades as
-- select
--   fda.id,
--   fda.organization_id,
--   o.name as organization_name,
--   fda.failure_type,
--   fda.severity,
--   fda.metadata->>'target_tier' as target_tier,
--   fda.metadata->>'current_tier' as current_tier,
--   fda.metadata->>'error' as error_message,
--   fda.retry_count,
--   fda.attempted_at,
--   fda.next_retry_at,
--   age(now(), fda.attempted_at) as time_since_failure
-- from public.failed_downgrade_attempts fda
-- join public.organizations o on o.id = fda.organization_id
-- where fda.resolved_at is null
-- order by fda.severity desc, fda.attempted_at desc
-- limit 100;

-- ======================================================================
-- COMMENTS
-- ======================================================================

comment on table public.failed_downgrade_attempts is
  'Tracks failed automated subscription downgrades for manual review and resolution';

comment on column public.failed_downgrade_attempts.failure_type is
  'Classification of failure: processing_error, db_update_failed, paystack_disable_failed, etc.';

comment on column public.failed_downgrade_attempts.severity is
  'Severity level: low (self-healing), medium (needs review), high (needs action), critical (urgent)';

comment on column public.failed_downgrade_attempts.metadata is
  'JSON object containing error details, subscription codes, and context for debugging';

comment on column public.failed_downgrade_attempts.resolution_action is
  'Action taken to resolve the failure: manual_sync, paystack_refund, retry_succeeded, etc.';