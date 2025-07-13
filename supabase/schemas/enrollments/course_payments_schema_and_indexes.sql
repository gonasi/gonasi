-- ====================================================================================
-- table: course_payments
-- description: records all payment transactions for course enrollments
-- ====================================================================================
create table public.course_payments (
  id uuid primary key default uuid_generate_v4(),
  
  -- enrollment relationship
  enrollment_id uuid not null references course_enrollments(id) on delete cascade,
  enrollment_activity_id uuid not null references course_enrollment_activities(id) on delete cascade,
  
  -- financial details
  amount_paid numeric(19,4) not null,                    -- actual amount paid
  currency_code currency_code not null,                  -- payment currency
  payment_method text not null,                          -- 'stripe', 'paypal', 'manual', etc.
  
  -- payment processor details
  payment_processor_id text,                             -- external payment ID (stripe charge ID, etc.)
  payment_processor_fee numeric(19,4),                   -- processing fee deducted
  net_amount numeric(19,4) not null,                     -- amount after fees
  
  -- payment status
  payment_status text not null default 'pending',       -- 'pending', 'completed', 'failed', 'refunded'
  payment_intent_id text,                                -- for tracking payment intents
  
  -- recipient details
  organization_id uuid not null references organizations(id) on delete cascade,
  payout_status text not null default 'pending',        -- 'pending', 'processed', 'failed'
  payout_processed_at timestamptz,                       -- when payout was processed
  
  -- metadata
  payment_metadata jsonb,                                -- flexible field for processor-specific data
  refund_amount numeric(19,4) default 0,                -- amount refunded
  refund_reason text,                                    -- reason for refund
  
  -- audit fields
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid not null references profiles(id) on delete set null,
  
  -- constraints
  constraint chk_payment_amounts check (amount_paid >= 0 and net_amount >= 0),
  constraint chk_refund_amount check (refund_amount >= 0 and refund_amount <= amount_paid),
  constraint chk_payment_status check (payment_status in ('pending', 'completed', 'failed', 'refunded')),
  constraint chk_payout_status check (payout_status in ('pending', 'processed', 'failed'))
);

-- indexes for payments table
create index idx_course_payments_enrollment_id on course_payments(enrollment_id);
create index idx_course_payments_enrollment_activity_id on course_payments(enrollment_activity_id);
create index idx_course_payments_organization_id on course_payments(organization_id);
create index idx_course_payments_payment_status on course_payments(payment_status);
create index idx_course_payments_payout_status on course_payments(payout_status);
create index idx_course_payments_created_at on course_payments(created_at);
create index idx_course_payments_processor_id on course_payments(payment_processor_id);