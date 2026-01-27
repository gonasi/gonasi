set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.enroll_user_via_invite(p_user_id uuid, p_published_course_id uuid, p_tier_id uuid, p_cohort_id uuid DEFAULT NULL::uuid, p_invite_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_now timestamptz := timezone('utc', now());
  v_enrollment_result jsonb;
  v_enrollment_id uuid;
  v_invite record;
begin
  ---------------------------------------------------------------
  -- Validate invite if provided
  ---------------------------------------------------------------
  if p_invite_id is not null then
    -- Lock and fetch the invite
    select id, email, published_course_id, accepted_at, expires_at
    into v_invite
    from public.course_invites
    where id = p_invite_id
    for update;

    if not found then
      return jsonb_build_object(
        'success', false,
        'message', 'Course invitation not found'
      );
    end if;

    -- Check if already accepted
    if v_invite.accepted_at is not null then
      return jsonb_build_object(
        'success', false,
        'message', 'This invitation has already been accepted'
      );
    end if;

    -- Check if expired
    if v_invite.expires_at is not null and v_invite.expires_at < v_now then
      return jsonb_build_object(
        'success', false,
        'message', 'This invitation has expired'
      );
    end if;

    -- Verify course matches
    if v_invite.published_course_id != p_published_course_id then
      return jsonb_build_object(
        'success', false,
        'message', 'This invitation is not valid for the selected course'
      );
    end if;
  end if;

  ---------------------------------------------------------------
  -- Enroll user using standard free enrollment flow
  ---------------------------------------------------------------
  v_enrollment_result := public.enroll_user_in_free_course(
    p_user_id := p_user_id,
    p_published_course_id := p_published_course_id,
    p_tier_id := p_tier_id,
    p_cohort_id := p_cohort_id
  );

  -- Check if enrollment was successful
  if v_enrollment_result->>'success' != 'true' then
    return v_enrollment_result;
  end if;

  v_enrollment_id := (v_enrollment_result->>'enrollment_id')::uuid;

  ---------------------------------------------------------------
  -- Mark invite as accepted if provided
  ---------------------------------------------------------------
  if p_invite_id is not null then
    update public.course_invites
    set accepted_at = v_now,
        updated_at = v_now
    where id = p_invite_id;

    -- Note: We mark the invite as accepted.
    -- The invite record itself maintains the relationship via published_course_id and email.
  end if;

  ---------------------------------------------------------------
  -- Return success with enrollment and invite info
  ---------------------------------------------------------------
  return jsonb_build_object(
    'success', true,
    'message', 'Successfully enrolled via invitation',
    'enrollment_id', v_enrollment_id,
    'invite_id', p_invite_id,
    'enrollment_details', v_enrollment_result
  );

exception
  when others then
    raise exception 'Invite enrollment failed: %', sqlerrm;
end;
$function$
;


