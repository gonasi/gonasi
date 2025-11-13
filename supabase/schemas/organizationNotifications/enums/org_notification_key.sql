-- ============================================================================
-- ENUM: public.org_notification_key
-- ============================================================================
create type public.org_notification_key as enum (
  -- ============================================================================
  -- Billing events
  -- ============================================================================
  'org_subscription_started',
  'org_subscription_renewed',
  'org_subscription_failed',
  'org_subscription_expiring',
  'org_payment_method_expiring',
  'org_invoice_ready',
  'org_tier_upgraded',
  'org_tier_downgraded',
  'org_downgrade_cancelled',

  -- ============================================================================
  -- Member management
  -- ============================================================================
  'org_member_invited',
  'org_member_joined',
  'org_member_left',
  'org_member_role_changed',
  'org_member_removed',
  'org_ownership_transferred',

  -- ============================================================================
  -- Course & content events
  -- ============================================================================
  'org_course_created',
  'org_course_updated',
  'org_course_published',
  'org_course_unpublished',
  'org_course_archived',
  'org_course_deleted',
  'org_course_milestone_reached',
  'org_course_enrollment_opened',
  'org_course_enrollment_closed',
  'org_course_review_posted',
  'org_course_review_flagged',
  'org_content_flagged',

  -- ============================================================================
  -- Purchases & transactions
  -- ============================================================================
  'org_course_purchase_completed',
  'org_course_purchase_refunded',
  'org_course_purchase_failed',
  'org_course_subscription_started',
  'org_course_subscription_renewed',
  'org_course_subscription_canceled',

  -- ============================================================================
  -- Compliance
  -- ============================================================================
  'org_verification_approved',
  'org_verification_rejected',
  'org_policy_update_required',

  -- ============================================================================
  -- System-wide
  -- ============================================================================
  'org_announcement',
  'org_maintenance_notice'
);
