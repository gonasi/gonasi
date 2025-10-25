-- ===========================================================
-- FUNCTION: public.update_wallet_balance()
-- PURPOSE:
--   Production-grade trigger that automatically updates wallet 
--   balances when ledger entries are inserted. Handles both 
--   available (balance_total) and reserved (balance_reserved) 
--   balances with full validation.
--
-- FEATURES:
--   ✓ Distinguishes between balance_total and balance_reserved
--   ✓ Validates sufficient balance before debits
--   ✓ Atomic updates (PostgreSQL triggers run in transaction)
--   ✓ Handles all wallet types (platform, org, user, external)
--   ✓ Comprehensive error handling with descriptive messages
--   ✓ Audit trail via updated_at timestamps
--   ✓ Security hardened with empty search_path
--
-- TRANSACTION TYPES:
--   - funds_hold, funds_release, reward_payout → balance_reserved
--   - All other types → balance_total
--
-- BEHAVIOR:
--   - Only processes status = 'completed' entries
--   - Skips 'external' wallet types (no internal wallet record)
--   - Raises exception on insufficient balance (rolls back)
--   - Credits: increase destination wallet balance
--   - Debits: decrease source wallet balance
-- ===========================================================

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
  v_is_reserved_transaction := new.type in ('funds_hold', 'funds_release', 'reward_payout');

  -- ===========================================================
  -- PROCESS DESTINATION WALLET (CREDITS)
  -- ===========================================================
  if new.destination_wallet_type != 'external' and new.destination_wallet_id is not null then
    
    if v_is_reserved_transaction then
      -- Credit to balance_reserved
      case new.destination_wallet_type
        when 'platform' then
          update public.platform_wallets
          set balance_reserved = balance_reserved + new.amount,
              updated_at = timezone('utc', now())
          where id = new.destination_wallet_id;
          
          if not found then
            raise exception 'Platform wallet % not found', new.destination_wallet_id;
          end if;

        when 'organization' then
          update public.org_wallets
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
      -- Credit to balance_total
      case new.destination_wallet_type
        when 'platform' then
          update public.platform_wallets
          set balance_total = balance_total + new.amount,
              updated_at = timezone('utc', now())
          where id = new.destination_wallet_id;
          
          if not found then
            raise exception 'Platform wallet % not found', new.destination_wallet_id;
          end if;

        when 'organization' then
          update public.org_wallets
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
          from public.platform_wallets
          where id = new.source_wallet_id;
          
          if not found then
            raise exception 'Platform wallet % not found', new.source_wallet_id;
          end if;
          
          if v_current_reserved < new.amount then
            raise exception 'Insufficient reserved balance in % wallet. Required: %, Available: %',
              v_wallet_owner, new.amount, v_current_reserved;
          end if;
          
          update public.platform_wallets
          set balance_reserved = balance_reserved - new.amount,
              updated_at = timezone('utc', now())
          where id = new.source_wallet_id;

        when 'organization' then
          -- Check sufficient reserved balance
          select balance_reserved, 'org-' || organization_id::text
          into v_current_reserved, v_wallet_owner
          from public.org_wallets
          where id = new.source_wallet_id;
          
          if not found then
            raise exception 'Organization wallet % not found', new.source_wallet_id;
          end if;
          
          if v_current_reserved < new.amount then
            raise exception 'Insufficient reserved balance in % wallet. Required: %, Available: %',
              v_wallet_owner, new.amount, v_current_reserved;
          end if;
          
          update public.org_wallets
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
      case new.source_wallet_type
        when 'platform' then
          -- Check sufficient total balance
          select balance_total, 'platform-' || currency_code::text
          into v_current_total, v_wallet_owner
          from public.platform_wallets
          where id = new.source_wallet_id;
          
          if not found then
            raise exception 'Platform wallet % not found', new.source_wallet_id;
          end if;
          
          if v_current_total < new.amount then
            raise exception 'Insufficient balance in % wallet. Required: %, Available: %',
              v_wallet_owner, new.amount, v_current_total;
          end if;
          
          update public.platform_wallets
          set balance_total = balance_total - new.amount,
              updated_at = timezone('utc', now())
          where id = new.source_wallet_id;

        when 'organization' then
          -- Check sufficient total balance
          select balance_total, 'org-' || organization_id::text
          into v_current_total, v_wallet_owner
          from public.org_wallets
          where id = new.source_wallet_id;
          
          if not found then
            raise exception 'Organization wallet % not found', new.source_wallet_id;
          end if;
          
          if v_current_total < new.amount then
            raise exception 'Insufficient balance in % wallet. Required: %, Available: %',
              v_wallet_owner, new.amount, v_current_total;
          end if;
          
          update public.org_wallets
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
    raise exception 'Wallet balance update failed for ledger entry %: %', new.id, sqlerrm;
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
  'Validates sufficient balance before debits and maintains separate tracking for '
  'available (balance_total) and reserved (balance_reserved) funds.';

comment on trigger trg_wallet_balance_update on public.wallet_ledger_entries is
  'Ensures wallet balances stay synchronized with ledger entries in real-time.';