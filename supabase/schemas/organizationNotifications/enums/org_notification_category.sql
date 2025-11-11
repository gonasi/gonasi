-- ============================================================================
-- ENUM: public.org_notification_category
-- ============================================================================
create type public.org_notification_category as enum (
  'billing',
  'members',
  'content',
  'compliance',
  'system'
);