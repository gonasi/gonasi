create or replace function process_delete_course_progress()
returns void
language plpgsql
set search_path = ''
as $$
declare
  task pgmq.message_record;
  course_uuid uuid;
begin
  for task in
    select * from pgmq.read('delete_course_progress_queue', 60, 5)  -- vt=60s, qty=5
  loop
    begin
      -- Parse the JSON message and validate course_id
      course_uuid := (task.message->>'course_id')::uuid;
      
      if course_uuid is null then
        raise exception 'Invalid course_id in message';
      end if;

      -- Delete from all progress tables in dependency order
      -- Start with the most granular (block_progress) and work up
      
      -- Delete block progress
      delete from public.block_progress
      where published_course_id = course_uuid;

      -- Delete lesson progress
      delete from public.lesson_progress
      where published_course_id = course_uuid;

      -- Delete chapter progress
      delete from public.chapter_progress
      where published_course_id = course_uuid;

      -- Delete course progress
      delete from public.course_progress
      where published_course_id = course_uuid;

      -- Delete lesson reset counts for this course
      delete from public.lesson_reset_count
      where published_course_id = course_uuid;

      -- Delete the message if successful
      perform pgmq.delete('delete_course_progress_queue', task.msg_id);
      
      raise notice 'Successfully deleted progress for course: %', course_uuid;
      
    exception
      when others then
        -- Log error but don't requeue to avoid infinite loops
        raise warning 'Failed to process delete task for course %: %', 
          coalesce((task.message->>'course_id'), 'unknown'), sqlerrm;
        -- Still delete the message to prevent reprocessing
        perform pgmq.delete('delete_course_progress_queue', task.msg_id);
    end;
  end loop;
end;
$$;