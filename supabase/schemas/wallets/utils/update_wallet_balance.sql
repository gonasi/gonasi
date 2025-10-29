-- ============================================================================
-- FUNCTION: public.update_wallet_balance()
-- ============================================================================
-- PURPOSE:
--   Production-grade trigger that automatically updates wallet balances when
--   ledger entries are inserted. Handles all wallet types:
--     - platform (Gonasi)
--     - organization
--     - user
--     - external
--
--   Supports:
--     - total balance (balance_total)
--     - reserved balance (balance_reserved)
--
--   This function is designed to be **atomic**: any failure rolls back the
--   ledger entry insert. All debits are validated against current balances.
--
--   Transaction types:
--     - funds_hold, funds_release, reward_payout → affect balance_reserved
--     - All other types → affect balance_total
--
--   Notes for junior interns:
--     1. Every ledger entry inserted fires this trigger.
--     2. `destination_wallet_type = 'external'` → no wallet update; assumed off-platform.
--     3. `source_wallet_type = 'external'` → no debit; assumed incoming from external payment.
--     4. Trigger ensures balances are consistent across all wallet types.
-- ============================================================================

create or replace function public.update_wallet_balance()
returns trigger
language plpgsql
set search_path = ''
security definer
as $$
declare
  v_current_total numeric(19,4);
  v_current_reserved numeric(19,4);
  v_wallet_owner text;
  v_is_reserved_transaction boolean;
begin
  -- Only act on completed ledger entries
  if new.status != 'completed' then
    return new;
  end if;

  -- Determine whether the transaction affects reserved balance
  v_is_reserved_transaction := new.type in ('funds_hold', 'funds_release', 'reward_payout');

  ------------------------------------------------------------
  -- 1. CREDIT DESTINATION WALLET
  ------------------------------------------------------------
  if new.destination_wallet_type != 'external' and new.destination_wallet_id is not null then
    if v_is_reserved_transaction then
      case new.destination_wallet_type
        when 'platform' then
          update public.gonasi_wallets
          set balance_reserved = balance_reserved + new.amount,
              updated_at = timezone('utc', now())
          where id = new.destination_wallet_id;
          if not found then raise exception 'Platform wallet % not found', new.destination_wallet_id; end if;

        when 'organization' then
          update public.organization_wallets
          set balance_reserved = balance_reserved + new.amount,
              updated_at = timezone('utc', now())
          where id = new.destination_wallet_id;
          if not found then raise exception 'Organization wallet % not found', new.destination_wallet_id; end if;

        when 'user' then
          update public.user_wallets
          set balance_reserved = balance_reserved + new.amount,
              updated_at = timezone('utc', now())
          where id = new.destination_wallet_id;
          if not found then raise exception 'User wallet % not found', new.destination_wallet_id; end if;
      end case;
    else
      -- Credit total balance
      case new.destination_wallet_type
        when 'platform' then
          update public.gonasi_wallets
          set balance_total = balance_total + new.amount,
              updated_at = timezone('utc', now())
          where id = new.destination_wallet_id;
          if not found then raise exception 'Platform wallet % not found', new.destination_wallet_id; end if;

        when 'organization' then
          update public.organization_wallets
          set balance_total = balance_total + new.amount,
              updated_at = timezone('utc', now())
          where id = new.destination_wallet_id;
          if not found then raise exception 'Organization wallet % not found', new.destination_wallet_id; end if;

        when 'user' then
          update public.user_wallets
          set balance_total = balance_total + new.amount,
              updated_at = timezone('utc', now())
          where id = new.destination_wallet_id;
          if not found then raise exception 'User wallet % not found', new.destination_wallet_id; end if;
      end case;
    end if;
  end if;

  ------------------------------------------------------------
  -- 2. DEBIT SOURCE WALLET
  ------------------------------------------------------------
  if new.source_wallet_type != 'external' and new.source_wallet_id is not null then
    if v_is_reserved_transaction then
      case new.source_wallet_type
        when 'platform' then
          select balance_reserved, 'platform-' || currency_code::text
          into v_current_reserved, v_wallet_owner
          from public.gonasi_wallets where id = new.source_wallet_id;

          if not found then raise exception 'Platform wallet % not found', new.source_wallet_id; end if;
          if v_current_reserved < new.amount then
            raise exception 'Insufficient reserved balance in % wallet. Required: %, Available: %', v_wallet_owner, new.amount, v_current_reserved;
          end if;

          update public.gonasi_wallets
          set balance_reserved = balance_reserved - new.amount,
              updated_at = timezone('utc', now())
          where id = new.source_wallet_id;

        when 'organization' then
          select balance_reserved, 'org-' || organization_id::text
          into v_current_reserved, v_wallet_owner
          from public.organization_wallets where id = new.source_wallet_id;

          if not found then raise exception 'Organization wallet % not found', new.source_wallet_id; end if;
          if v_current_reserved < new.amount then
            raise exception 'Insufficient reserved balance in % wallet. Required: %, Available: %', v_wallet_owner, new.amount, v_current_reserved;
          end if;

          update public.organization_wallets
          set balance_reserved = balance_reserved - new.amount,
              updated_at = timezone('utc', now())
          where id = new.source_wallet_id;

        when 'user' then
          select balance_reserved, 'user-' || user_id::text
          into v_current_reserved, v_wallet_owner
          from public.user_wallets where id = new.source_wallet_id;

          if not found then raise exception 'User wallet % not found', new.source_wallet_id; end if;
          if v_current_reserved < new.amount then
            raise exception 'Insufficient reserved balance in % wallet. Required: %, Available: %', v_wallet_owner, new.amount, v_current_reserved;
          end if;

          update public.user_wallets
          set balance_reserved = balance_reserved - new.amount,
              updated_at = timezone('utc', now())
          where id = new.source_wallet_id;
      end case;

    else
      case new.source_wallet_type
        when 'platform' then
          select balance_total, 'platform-' || currency_code::text
          into v_current_total, v_wallet_owner
          from public.gonasi_wallets where id = new.source_wallet_id;

          if not found then raise exception 'Platform wallet % not found', new.source_wallet_id; end if;
          if v_current_total < new.amount then
            raise exception 'Insufficient balance in % wallet. Required: %, Available: %', v_wallet_owner, new.amount, v_current_total;
          end if;

          update public.gonasi_wallets
          set balance_total = balance_total - new.amount,
              updated_at = timezone('utc', now())
          where id = new.source_wallet_id;

        when 'organization' then
          select balance_total, 'org-' || organization_id::text
          into v_current_total, v_wallet_owner
          from public.organization_wallets where id = new.source_wallet_id;

          if not found then raise exception 'Organization wallet % not found', new.source_wallet_id; end if;
          if v_current_total < new.amount then
            raise exception 'Insufficient balance in % wallet. Required: %, Available: %', v_wallet_owner, new.amount, v_current_total;
          end if;

          update public.organization_wallets
          set balance_total = balance_total - new.amount,
              updated_at = timezone('utc', now())
          where id = new.source_wallet_id;

        when 'user' then
          select balance_total, 'user-' || user_id::text
          into v_current_total, v_wallet_owner
          from public.user_wallets where id = new.source_wallet_id;

          if not found then raise exception 'User wallet % not found', new.source_wallet_id; end if;
          if v_current_total < new.amount then
            raise exception 'Insufficient balance in % wallet. Required: %, Available: %', v_wallet_owner, new.amount, v_current_total;
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
    raise exception 'Wallet balance update failed for ledger entry %: %', new.id, sqlerrm;
end;
$$;


create trigger trg_wallet_ledger_after_insert
after insert on public.wallet_ledger_entries
for each row
execute function public.update_wallet_balance();
