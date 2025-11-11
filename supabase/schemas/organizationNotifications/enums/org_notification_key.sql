-- ============================================================================
-- ENUM: public.org_notification_key
-- ============================================================================
create type public.org_notification_key as enum (
  -- Billing events
  'org_subscription_started',
  'org_subscription_renewed',
  'org_subscription_failed',
  'org_subscription_expiring',
  'org_payment_method_expiring',
  'org_invoice_ready',
  'org_tier_upgraded',
  'org_tier_downgraded',
  
  -- Member management
  'org_member_invited',
  'org_member_joined',
  'org_member_left',
  'org_member_role_changed',
  'org_member_removed',
  'org_ownership_transferred',
  
  -- Content events
  'org_course_published',
  'org_course_milestone_reached',
  'org_content_flagged',
  
  -- Compliance
  'org_verification_approved',
  'org_verification_rejected',
  'org_policy_update_required',
  
  -- System-wide
  'org_announcement',
  'org_maintenance_notice'
);