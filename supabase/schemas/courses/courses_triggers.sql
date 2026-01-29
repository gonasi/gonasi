-- ====================================================================================
-- FUNCTION: track_course_update_type
-- PURPOSE: Automatically tracks what type of update occurred on a course
--          (content/pricing/overview/multiple) and increments the appropriate version
-- ====================================================================================
create or replace function public.track_course_update_type()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  update_types text[] := '{}';
begin
  -- On INSERT, default to content
  if TG_OP = 'INSERT' then
    NEW.last_update_type := 'content'::course_update_type;
    return NEW;
  end if;

  -- Check overview changes (metadata)
  if (NEW.name is distinct from OLD.name or
      NEW.description is distinct from OLD.description or
      NEW.image_url is distinct from OLD.image_url or
      NEW.blur_hash is distinct from OLD.blur_hash or
      NEW.category_id is distinct from OLD.category_id or
      NEW.subcategory_id is distinct from OLD.subcategory_id or
      NEW.visibility is distinct from OLD.visibility) then
    update_types := array_append(update_types, 'overview');
    NEW.overview_version := OLD.overview_version + 1;
  end if;

  -- Content and pricing version increments are handled by child table triggers
  -- via trg_touch_course_updated_at_on_related_table_change
  -- This trigger only handles overview changes

  -- Set last_update_type based on what changed
  if array_length(update_types, 1) > 1 then
    NEW.last_update_type := 'multiple'::course_update_type;
  elsif array_length(update_types, 1) = 1 then
    NEW.last_update_type := update_types[1]::course_update_type;
  else
    -- No changes detected in this trigger, preserve existing value
    NEW.last_update_type := OLD.last_update_type;
  end if;

  return NEW;
end;
$$;

-- ====================================================================================
-- TRIGGER: Track course update type on changes
-- ====================================================================================
create trigger trg_track_course_update_type
  before update on public.courses
  for each row
  execute function public.track_course_update_type();
