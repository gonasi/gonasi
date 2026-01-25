-- ===================================================
-- FUNCTION: can_send_course_invite
-- ===================================================
-- Purpose: Enforce tier-based restrictions on course invites
--
-- Rules:
-- - temp tier: Cannot send invites (can't create courses anyway)
-- - launch tier: Can only send invites for PAID courses
-- - scale/impact tiers: Can send invites for both free and paid courses
-- ===================================================

create or replace function public.can_send_course_invite(
  p_org_id uuid,
  p_published_course_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
  org_tier public.subscription_tier;
  course_has_free_tier boolean;
begin
  -- Get organization tier
  org_tier := public.get_org_tier(p_org_id);

  -- temp tier cannot send invites (can't create courses)
  if org_tier = 'temp' then
    return false;
  end if;

  -- Get course pricing info
  select has_free_tier into course_has_free_tier
  from public.published_courses
  where id = p_published_course_id;

  -- launch tier cannot send invites for free courses
  if org_tier = 'launch' and course_has_free_tier then
    return false;
  end if;

  -- All other cases are allowed (scale, impact can send for any course)
  return true;
end;
$$;
