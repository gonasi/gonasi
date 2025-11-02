-- Create PGMQ queue
select pgmq.create('delete_course_progress_queue');
select pgmq.create('user_notifications_email_queue');


select cron.schedule(
  'process-delete-course-progress',
  '* * * * *', -- every minute
  $$ select process_delete_course_progress(); $$
);

select cron.schedule(
  'daily-ai-credit-reset',
  '0 0 * * *',  -- every day at midnight UTC
  $$ select public.reset_org_ai_base_credits_when_due(); $$
);

-- ============================================================================
-- CRON: user-notifications-email-dispatch
-- ============================================================================
-- PURPOSE:
--   Invokes the Edge Function responsible for processing user notification
--   emails (dequeueing from PGMQ, sending emails, handling retries, etc).
--
--   This cron ONLY triggers the Edge Function. All processing happens in the
--   function itself.
--
-- SCHEDULE:
--   Every 1 minute
-- ============================================================================
select cron.schedule(
  'invoke-user-notifications-email-dispatch',
  '* * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/user-notifications-email-dispatch',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'publishable_key')
    ),
    body := jsonb_build_object('time', now())
  ) as request_id;
  $$
);
