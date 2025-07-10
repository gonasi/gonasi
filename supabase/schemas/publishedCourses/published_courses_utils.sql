-- ====================================================================================
-- HELPER FUNCTIONS
-- ====================================================================================

-- Function to extract searchable text from course_data
create or replace function public.extract_course_content_text(course_data jsonb)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  result text := '';
  chapter jsonb;
  lesson jsonb;
  block jsonb;
begin
  for chapter in select jsonb_array_elements(course_data->'chapters')
  loop
    result := result || ' ' || coalesce(chapter->>'name', '') || ' ' || coalesce(chapter->>'description', '');
    
    for lesson in select jsonb_array_elements(chapter->'lessons')
    loop
      result := result || ' ' || coalesce(lesson->>'name', '');
      
      for block in select jsonb_array_elements(lesson->'blocks')
      loop
        if block->>'plugin_type' = 'rich_text' then
          result := result || ' ' || coalesce(block->'content'->>'text', '');
        end if;
      end loop;
    end loop;
  end loop;
  
  return result;
end;
$$;
