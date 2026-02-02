-- ====================================================================================
-- FUNCTION: track_course_update_type
-- PURPOSE: Automatically tracks what types of updates occurred on a course
--          (content/pricing/overview) as an array and increments the appropriate version
-- NOTE: This appends 'overview' to the array if not already present
-- ====================================================================================
create or replace function public.track_course_update_type()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- On INSERT, default to content
  if TG_OP = 'INSERT' then
    NEW.last_update_types := ARRAY['content']::public.course_update_type[];
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

    -- Increment overview version
    NEW.overview_version := OLD.overview_version + 1;

    -- Append 'overview' to last_update_types if not already present
    if NEW.last_update_types is null then
      NEW.last_update_types := ARRAY['overview']::public.course_update_type[];
    elsif not ('overview'::public.course_update_type = any(NEW.last_update_types)) then
      NEW.last_update_types := array_append(NEW.last_update_types, 'overview'::public.course_update_type);
    end if;
  end if;

  -- Content and pricing version increments are handled by child table triggers
  -- via trg_touch_course_updated_at

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
