select cron.schedule(
  'daily-ai-credit-reset',
  '0 0 * * *',  -- every day at midnight UTC
  $$ select public.reset_org_ai_base_credits_when_due(); $$
);
