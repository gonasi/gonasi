create or replace function public.update_wallet_balance()
returns trigger
language plpgsql
set search_path = ''
security definer
as $$
declare
  -- Variables for balance validation
  v_current_total numeric(19,4);
  v_current_reserved numeric(19,4);
  v_wallet_owner text;
  v_is_reserved_transaction boolean;
begin
  -- Only process completed transactions
  if new.status != 'completed' then
    return new;
  end if;

  -- Determine if this transaction affects reserved balance
  -- Reserved transactions: funds_hold, funds_release, reward_payout
  v_is_reserved_transaction := new.type in ('funds_hold', 'funds_release', 'reward_payout');

  -- ===========================================================
  -- PROCESS DESTINATION WALLET (CREDITS)
  -- ===========================================================
  if new.destination_wallet_type != 'external' and new.destination_wallet_id is not null then
    
    if v_is_reserved_transaction then
      -- Credit to balance_reserved
      case new.destination_wallet_type
        when 'platform' then
          update public.gonasi_wallets
          set balance_reserved = balance_reserved + new.amount,
              updated_at = timezone('utc', now())
          where id = new.destination_wallet_id;
          
          if not found then
            raise exception 'Platform wallet % not found', new.destination_wallet_id;
          end if;

        when 'organization' then
          update public.organization_wallets
          set balance_reserved = balance_reserved + new.amount,
              updated_at = timezone('utc', now())
          where id = new.destination_wallet_id;
          
          if not found then
            raise exception 'Organization wallet % not found', new.destination_wallet_id;
          end if;

        when 'user' then
          update public.user_wallets
          set balance_reserved = balance_reserved + new.amount,
              updated_at = timezone('utc', now())
          where id = new.destination_wallet_id;
          
          if not found then
            raise exception 'User wallet % not found', new.destination_wallet_id;
          end if;
      end case;

    else
      -- Credit to balance_total (includes course_purchase, payment_inflow, platform_revenue, etc.)
      case new.destination_wallet_type
        when 'platform' then
          update public.gonasi_wallets
          set balance_total = balance_total + new.amount,
              updated_at = timezone('utc', now())
          where id = new.destination_wallet_id;
          
          if not found then
            raise exception 'Platform wallet % not found', new.destination_wallet_id;
          end if;

        when 'organization' then
          update public.organization_wallets
          set balance_total = balance_total + new.amount,
              updated_at = timezone('utc', now())
          where id = new.destination_wallet_id;
          
          if not found then
            raise exception 'Organization wallet % not found', new.destination_wallet_id;
          end if;

        when 'user' then
          update public.user_wallets
          set balance_total = balance_total + new.amount,
              updated_at = timezone('utc', now())
          where id = new.destination_wallet_id;
          
          if not found then
            raise exception 'User wallet % not found', new.destination_wallet_id;
          end if;
      end case;
    end if;
  end if;

  -- ===========================================================
  -- PROCESS SOURCE WALLET (DEBITS)
  -- ===========================================================
  if new.source_wallet_type != 'external' and new.source_wallet_id is not null then
    
    if v_is_reserved_transaction then
      -- Debit from balance_reserved (with validation)
      case new.source_wallet_type
        when 'platform' then
          -- Check sufficient reserved balance
          select balance_reserved, 'platform-' || currency_code::text
          into v_current_reserved, v_wallet_owner
          from public.gonasi_wallets
          where id = new.source_wallet_id;
          
          if not found then
            raise exception 'Platform wallet % not found', new.source_wallet_id;
          end if;
          
          if v_current_reserved < new.amount then
            raise exception 'Insufficient reserved balance in % wallet. Required: %, Available: %',
              v_wallet_owner, new.amount, v_current_reserved;
          end if;
          
          update public.gonasi_wallets
          set balance_reserved = balance_reserved - new.amount,
              updated_at = timezone('utc', now())
          where id = new.source_wallet_id;

        when 'organization' then
          -- Check sufficient reserved balance
          select balance_reserved, 'org-' || organization_id::text
          into v_current_reserved, v_wallet_owner
          from public.organization_wallets
          where id = new.source_wallet_id;
          
          if not found then
            raise exception 'Organization wallet % not found', new.source_wallet_id;
          end if;
          
          if v_current_reserved < new.amount then
            raise exception 'Insufficient reserved balance in % wallet. Required: %, Available: %',
              v_wallet_owner, new.amount, v_current_reserved;
          end if;
          
          update public.organization_wallets
          set balance_reserved = balance_reserved - new.amount,
              updated_at = timezone('utc', now())
          where id = new.source_wallet_id;

        when 'user' then
          -- Check sufficient reserved balance
          select balance_reserved, 'user-' || user_id::text
          into v_current_reserved, v_wallet_owner
          from public.user_wallets
          where id = new.source_wallet_id;
          
          if not found then
            raise exception 'User wallet % not found', new.source_wallet_id;
          end if;
          
          if v_current_reserved < new.amount then
            raise exception 'Insufficient reserved balance in % wallet. Required: %, Available: %',
              v_wallet_owner, new.amount, v_current_reserved;
          end if;
          
          update public.user_wallets
          set balance_reserved = balance_reserved - new.amount,
              updated_at = timezone('utc', now())
          where id = new.source_wallet_id;
      end case;

    else
      -- Debit from balance_total (with validation)
      -- Includes: platform_revenue, payment_gateway_fee, org_payout, withdrawal_complete, etc.
      case new.source_wallet_type
        when 'platform' then
          -- Check sufficient total balance
          select balance_total, 'platform-' || currency_code::text
          into v_current_total, v_wallet_owner
          from public.gonasi_wallets
          where id = new.source_wallet_id;
          
          if not found then
            raise exception 'Platform wallet % not found', new.source_wallet_id;
          end if;
          
          if v_current_total < new.amount then
            raise exception 'Insufficient balance in % wallet. Required: %, Available: %',
              v_wallet_owner, new.amount, v_current_total;
          end if;
          
          update public.gonasi_wallets
          set balance_total = balance_total - new.amount,
              updated_at = timezone('utc', now())
          where id = new.source_wallet_id;

        when 'organization' then
          -- Check sufficient total balance
          select balance_total, 'org-' || organization_id::text
          into v_current_total, v_wallet_owner
          from public.organization_wallets
          where id = new.source_wallet_id;
          
          if not found then
            raise exception 'Organization wallet % not found', new.source_wallet_id;
          end if;
          
          if v_current_total < new.amount then
            raise exception 'Insufficient balance in % wallet. Required: %, Available: %',
              v_wallet_owner, new.amount, v_current_total;
          end if;
          
          update public.organization_wallets
          set balance_total = balance_total - new.amount,
              updated_at = timezone('utc', now())
          where id = new.source_wallet_id;

        when 'user' then
          -- Check sufficient total balance
          select balance_total, 'user-' || user_id::text
          into v_current_total, v_wallet_owner
          from public.user_wallets
          where id = new.source_wallet_id;
          
          if not found then
            raise exception 'User wallet % not found', new.source_wallet_id;
          end if;
          
          if v_current_total < new.amount then
            raise exception 'Insufficient balance in % wallet. Required: %, Available: %',
              v_wallet_owner, new.amount, v_current_total;
          end if;
          
          update public.user_wallets
          set balance_total = balance_total - new.amount,
              updated_at = timezone('utc', now())
          where id = new.source_wallet_id;
      end case;
    end if;
  end if;

  return new;
exception
  when others then
    -- Re-raise with context for debugging
    raise exception 'Wallet balance update failed for ledger entry % (type: %): %', 
      new.id, new.type, sqlerrm;
end;
$$;

-- ===========================================================
-- TRIGGER SETUP
-- ===========================================================
-- Drop existing trigger if it exists (safe for re-deployment)
drop trigger if exists trg_wallet_balance_update on public.wallet_ledger_entries;

-- Create trigger to fire after each insert
create trigger trg_wallet_balance_update
  after insert on public.wallet_ledger_entries
  for each row
  execute function public.update_wallet_balance();

-- ===========================================================
-- COMMENTS FOR DOCUMENTATION
-- ===========================================================
comment on function public.update_wallet_balance() is 
  'Automatically updates wallet balances when completed ledger entries are inserted. '
  'Handles all transaction types from ledger_transaction_type enum. '
  'Reserved transactions (funds_hold, funds_release, reward_payout) affect balance_reserved. '
  'All other transactions (course_purchase, platform_revenue, payment_gateway_fee, etc.) affect balance_total. '
  'Validates sufficient balance before debits and maintains separate tracking for '
  'available (balance_total) and reserved (balance_reserved) funds.';

comment on trigger trg_wallet_balance_update on public.wallet_ledger_entries is
  'Ensures wallet balances stay synchronized with ledger entries in real-time. '
  'Processes all transaction types according to ledger_transaction_type enum.';