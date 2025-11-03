-- ====================================================================================
-- TYPE: course_access (defines course visibility options)
-- ====================================================================================
create type public.course_access as enum (
  'public',          -- visible + searchable
  'unlisted',        -- URL-only
  'private'          -- invite/enrollment only
);
