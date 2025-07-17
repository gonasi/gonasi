-- ====================================================================================
-- TABLE: course_payments
-- DESCRIPTION: Records all confirmed payment transactions for course enrollments.
--              Includes platform fees, organization payouts, processor metadata,
--              and refund tracking. All rows represent successful payments.
-- ====================================================================================
create table public.course_payments (
  id uuid primary key default uuid_generate_v4(),
  
  -- Related enrollment and activity
  enrollment_id uuid not null references course_enrollments(id) on delete cascade,
  enrollment_activity_id uuid not null references course_enrollment_activities(id) on delete cascade,
  
  -- Payment summary
  amount_paid numeric(19,4) not null,                    -- Gross amount paid by the user
  currency_code currency_code not null,                  -- ISO currency code (e.g. 'USD', 'KES')
  payment_method text not null,                          -- Payment method used ('stripe', 'paypal', 'manual', etc.)

  -- Processor-related fields
  payment_processor_id text,                             -- External processor transaction ID (e.g. Stripe charge ID)
  payment_processor_fee numeric(19,4),                   -- Processor fee deducted (e.g. Stripe's fee)
  net_amount numeric(19,4) not null,                     -- Net amount after processor fees

  -- Platform commission
  platform_fee numeric(19,4) not null,                   -- Gonasi's revenue from this transaction
  platform_fee_percent numeric(5,2) not null,            -- Commission rate used to calculate platform_fee
  org_payout_amount numeric(19,4) not null,              -- Final payout amount to the course's organization (net - platform_fee)

  -- Optional processor intent (for reconciliation)
  payment_intent_id text,                                -- External payment intent ID (optional)

  -- Organization details
  organization_id uuid not null references organizations(id) on delete cascade,
  payout_processed_at timestamptz,                       -- Timestamp when payout was executed (optional)

  -- Refunds and metadata
  payment_metadata jsonb,                                -- Arbitrary processor-specific metadata
  refund_amount numeric(19,4) default 0,                 -- Total refunded amount, if any
  refund_reason text,                                    -- Optional reason for refund

  -- Audit trail
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid not null references profiles(id) on delete set null,

  -- Validation constraints
  constraint chk_payment_amounts check (
    amount_paid >= 0 and net_amount >= 0 and platform_fee >= 0 and org_payout_amount >= 0
  ),
  constraint chk_refund_amount check (
    refund_amount >= 0 and refund_amount <= amount_paid
  ),
  constraint chk_platform_fee_percent check (
    platform_fee_percent >= 0 and platform_fee_percent <= 100
  )
);

-- Optimize lookup by enrollment
create index idx_course_payments_enrollment_id on course_payments(enrollment_id);
create index idx_course_payments_enrollment_activity_id on course_payments(enrollment_activity_id);

-- Optimize org-level reporting and filtering
create index idx_course_payments_organization_id on course_payments(organization_id);

-- Optimize processor reconciliation and reporting
create index idx_course_payments_processor_id on course_payments(payment_processor_id);

-- Optimize time-based queries
create index idx_course_payments_created_at on course_payments(created_at);

-- Optimize lookup by creator (resolves missing FK index warning)
create index idx_course_payments_created_by on course_payments(created_by);