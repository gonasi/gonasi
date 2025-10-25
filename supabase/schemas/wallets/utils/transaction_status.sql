-- ===========================================================
-- ENUM: transaction_status
-- -----------------------------------------------------------
-- Represents the state of a wallet transaction.
--
-- 'pending'   - Awaiting confirmation (e.g. Paystack callback not yet received)
-- 'completed' - Successfully processed and reflected in wallet balance
-- 'failed'    - Attempt failed (e.g. insufficient funds, payment declined)
-- 'reversed'  - Rolled back after completion (e.g. refund, reversal)
-- ===========================================================
do $$
begin
  -- drop existing enum if it exists
  if exists (select 1 from pg_type where typname = 'transaction_status') then
    drop type public.transaction_status;
  end if;

  -- recreate enum
  create type public.transaction_status as enum (
    'pending',
    'completed',
    'failed',
    'reversed'
  );
end
$$;
