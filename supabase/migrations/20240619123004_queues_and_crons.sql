-- Create PGMQ queue
select pgmq.create('delete_course_progress_queue');

select cron.schedule(
  'process-delete-course-progress',
  '*/1 * * * *',
  $$ select process_delete_course_progress(); $$
);

select cron.schedule(
  'daily-ai-credit-reset',
  '0 0 * * *',  -- every day at midnight UTC
  $$ select public.reset_org_ai_base_credits_when_due(); $$
);