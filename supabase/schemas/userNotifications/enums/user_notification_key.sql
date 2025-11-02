-- ============================================================================
-- ENUM: public.user_notification_key
-- ============================================================================
-- PURPOSE:
--   Defines every *specific* notification type that the Gonasi platform may send
--   to an end user. These are the canonical keys used throughout:
--     - Database triggers
--     - Background jobs (pgmq → Resend)
--     - API functions (insert_user_notification)
--     - Frontend rendering and routing
--
--   Why an ENUM?
--     - Prevents typos and inconsistent string literals.
--     - Ensures all notification types are centrally governed.
--     - Guarantees strong referential integrity across the system.
--
--   Each notification type corresponds to a real event in the platform.
--   They are grouped into the same categories used in
--   `user_notification_category`, but the enums here represent the
--   *granular, actionable* units.
--
--   Guidelines:
--     - Keys should be descriptive, lowercase, snake_case.
--     - Keys should follow the pattern:
--         <object>_<action> (e.g. "course_completed")
--     - Keys are versioned implicitly. If a behavior changes significantly,
--       introduce a new key rather than repurposing an old one.
--
--   Below is the curated list of system-approved notification keys.
-- ============================================================================
create type public.user_notification_key as enum (
  -- Commerce events
  'course_purchase_success',
  'course_purchase_failed',
  'course_refund_processed',
  'course_subscription_started',
  'course_subscription_renewed',
  'course_subscription_failed',
  'course_subscription_expiring',

  'course_enrollment_free_success',

  -- Learning progress
  'lesson_completed',
  'course_completed',
  'streak_reminder',
  'new_chapter_unlocked',

  -- Billing & account
  'payment_method_expiring',
  'invoice_ready',
  'account_security_alert',

  -- Social / collaboration
  'organization_invite_received',
  'organization_invite_accepted',
  'organization_role_changed',

  -- System-wide
  'announcement',
  'maintenance_notice'
);
