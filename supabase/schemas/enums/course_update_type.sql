-- ====================================================================================
-- TYPE: course_update_type (defines types of course updates for version tracking)
-- ====================================================================================
create type public.course_update_type as enum (
  'content',         -- chapters, lessons, blocks, or files changed
  'pricing',         -- pricing tiers changed
  'overview',        -- name, description, category, or thumbnail changed
  'multiple'         -- more than one type of update occurred
);
