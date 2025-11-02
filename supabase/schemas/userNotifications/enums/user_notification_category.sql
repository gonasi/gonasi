-- ============================================================================
-- ENUM: public.user_notification_category
-- ============================================================================
-- PURPOSE:
--   Categorizes user notifications into high-level groups. These categories
--   help with:
--     - Structuring user preference settings (e.g., user can disable
--       all "social" notifications at once)
--     - Organizing notifications in the UI (grouping sections)
--     - Analytics and filtering (e.g., which category has the most reads)
--
--   Each notification type must belong to one of the following categories:
--
--   'commerce'
--       Notifications related to monetary transactions or purchases,
--       such as course purchases, refunds, and subscription renewals.
--
--   'learning'
--       Notifications relating to progress and engagement inside learning
--       content, such as completing lessons, streak reminders, or new
--       chapters being unlocked.
--
--   'billing'
--       Notifications focused on account billing and financial maintenance,
--       such as payment methods expiring, invoices generated, or security
--       alerts involving financial activity.
--
--   'social'
--       Notifications triggered by interactions between users or
--       organizations, such as organization invites, role changes,
--       or collaborator actions.
--
--   'system'
--       Global platform-wide notices sent by Gonasi, such as maintenance
--       announcements, important updates, or messages that apply to all users.
--
--   This enum is intentionally stable and should rarely change. Any new
--   notification type should fit into one of these categories or require
--   a deliberate product decision to introduce a new category.
-- ============================================================================
create type public.user_notification_category as enum (
  'commerce',
  'learning',
  'billing',
  'social',
  'system'
);
