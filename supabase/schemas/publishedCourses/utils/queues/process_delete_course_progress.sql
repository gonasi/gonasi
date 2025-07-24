create or replace function process_delete_course_progress()
returns void
language plpgsql
as $$
declare
  task pgmq.message_record;
begin
  for task in
    select * from pgmq.read('delete_course_progress', 60, 5)  -- vt=60s, qty=5
  loop
    begin
      -- Parse the JSON message
      perform task.message->>'course_id';

      -- Your delete logic here
      delete from user_lesson_progress
      where course_id = (task.message->>'course_id')::uuid;

      delete from lesson_reset_count
      where course_id = (task.message->>'course_id')::uuid;

      -- Delete the message if successful
      perform pgmq.delete('delete_course_progress', task.msg_id);
    exception
      when others then
        -- Optionally log error or requeue
        raise warning 'Failed to process delete task: %', sqlerrm;
    end;
  end loop;
end;
$$;
