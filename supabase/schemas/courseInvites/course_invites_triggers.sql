-- ============================================================================
-- TRIGGERS FOR COURSE INVITES
-- ============================================================================

-- ============================================================================
-- FUNCTION: revoke_invites_on_pricing_tier_deletion
-- ----------------------------------------------------------------------------
-- Automatically revokes course invites when their associated pricing tier
-- is deleted by an admin. This ensures that invites tied to deleted tiers
-- are invalidated and cannot be accepted.
--
-- Behavior:
--   - Sets revoked_at timestamp for all pending invites
--   - pricing_tier_id is set to NULL by the ON DELETE SET NULL constraint
--   - Only affects invites that haven't been accepted or revoked yet
--   - Preserves audit trail (invites remain in database)
-- ============================================================================
create or replace function public.revoke_invites_on_pricing_tier_deletion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Update all pending invites that reference the deleted pricing tier
  update public.course_invites
  set revoked_at = now()
  where pricing_tier_id = old.id
    and accepted_at is null
    and revoked_at is null;

  return old;
end;
$$;

-- Drop existing trigger if it exists
drop trigger if exists trg_revoke_invites_on_tier_deletion on public.course_pricing_tiers;

-- Create trigger that fires after a pricing tier is deleted
create trigger trg_revoke_invites_on_tier_deletion
after delete on public.course_pricing_tiers
for each row
execute function public.revoke_invites_on_pricing_tier_deletion();
