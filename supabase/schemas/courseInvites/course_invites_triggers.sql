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

-- ============================================================================
-- FUNCTION: revoke_invites_on_pricing_tier_deactivation
-- ----------------------------------------------------------------------------
-- Automatically revokes course invites when their associated pricing tier
-- is deactivated (is_active changes from true to false). This ensures that
-- invites tied to inactive tiers cannot be accepted.
--
-- Behavior:
--   - Sets revoked_at timestamp for all pending invites
--   - Only fires when is_active changes from true to false
--   - Only affects invites that haven't been accepted or revoked yet
--   - Preserves audit trail (invites remain in database)
-- ============================================================================
create or replace function public.revoke_invites_on_pricing_tier_deactivation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Only process if is_active changed from true to false
  if old.is_active = true and new.is_active = false then
    -- Update all pending invites that reference the deactivated pricing tier
    update public.course_invites
    set revoked_at = now()
    where pricing_tier_id = new.id
      and accepted_at is null
      and revoked_at is null;
  end if;

  return new;
end;
$$;

-- Drop existing trigger if it exists
drop trigger if exists trg_revoke_invites_on_tier_deactivation on public.course_pricing_tiers;

-- Create trigger that fires after a pricing tier is updated
create trigger trg_revoke_invites_on_tier_deactivation
after update on public.course_pricing_tiers
for each row
execute function public.revoke_invites_on_pricing_tier_deactivation();

-- ============================================================================
-- FUNCTION: revoke_invites_on_course_visibility_change
-- ----------------------------------------------------------------------------
-- Automatically revokes course invites when a published course's visibility
-- changes from 'private' to 'public' or 'unlisted'. Email invitations are
-- only needed for private courses. Public and unlisted courses can be accessed
-- directly via link, making invitations unnecessary.
--
-- Behavior:
--   - Sets revoked_at timestamp for all pending invites
--   - Only fires when visibility changes from 'private' to 'public'/'unlisted'
--   - Only affects invites that haven't been accepted or revoked yet
--   - Preserves audit trail (invites remain in database)
-- ============================================================================
create or replace function public.revoke_invites_on_course_visibility_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Only process if visibility changed from 'private' to 'public' or 'unlisted'
  if old.visibility = 'private' and new.visibility in ('public', 'unlisted') then
    -- Update all pending invites for this published course
    update public.course_invites
    set revoked_at = now()
    where published_course_id = new.id
      and accepted_at is null
      and revoked_at is null;
  end if;

  return new;
end;
$$;

-- Drop existing trigger if it exists
drop trigger if exists trg_revoke_invites_on_visibility_change on public.published_courses;

-- Create trigger that fires after a published course is updated
create trigger trg_revoke_invites_on_visibility_change
after update on public.published_courses
for each row
execute function public.revoke_invites_on_course_visibility_change();
