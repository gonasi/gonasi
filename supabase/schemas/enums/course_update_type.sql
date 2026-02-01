-- ====================================================================================
-- TYPE: course_update_type (defines types of course updates for version tracking)
-- ====================================================================================
-- NOTE: This enum is used in ARRAY columns to track multiple simultaneous updates
-- Example: ARRAY['content', 'pricing']::course_update_type[]
-- ====================================================================================
create type public.course_update_type as enum (
  'content',         -- chapters, lessons, blocks, or files changed
  'pricing',         -- pricing tiers changed
  'overview'         -- name, description, category, or thumbnail changed
);
