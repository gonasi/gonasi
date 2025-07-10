-- Function to validate course_data JSON structure
create or replace function public.validate_course_data(course_data jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
begin
  -- Check if course_data is valid JSON
  if course_data is null then
    return false;
  end if;
  
  -- Check if it has the required structure
  if not (course_data ? 'chapters') then
    return false;
  end if;
  
  -- Check if chapters is an array
  if jsonb_typeof(course_data->'chapters') != 'array' then
    return false;
  end if;
  
  return true;
end;
$$;



-- Function to extract all tags from course content (for auto-tagging)
create or replace function public.extract_course_tags(course_data jsonb)
returns text[]
language plpgsql
immutable
set search_path = ''
as $$
declare
  tags text[] := array[]::text[];
  chapter jsonb;
  lesson jsonb;
  block jsonb;
begin
  -- Handle null or empty course_data
  if course_data is null or course_data = '{}'::jsonb then
    return array[]::text[];
  end if;

  -- Extract potential tags from chapter and lesson names
  if course_data ? 'chapters' then
    for chapter in select jsonb_array_elements(course_data->'chapters')
    loop
      if chapter ? 'lessons' then
        for lesson in select jsonb_array_elements(chapter->'lessons')
        loop
          -- Add lesson type as a tag
          if lesson ? 'lesson_type' then
            tags := array_append(tags, lesson->>'lesson_type');
          end if;
          
          -- Extract plugin types as tags
          if lesson ? 'blocks' then
            for block in select jsonb_array_elements(lesson->'blocks')
            loop
              if block ? 'plugin_type' then
                tags := array_append(tags, block->>'plugin_type');
              end if;
            end loop;
          end if;
        end loop;
      end if;
    end loop;
  end if;
  
  -- Remove duplicates and return
  return array(select distinct unnest(tags));
end;
$$;