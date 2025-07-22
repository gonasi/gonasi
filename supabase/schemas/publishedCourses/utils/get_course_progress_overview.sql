-- =====================================================================================================
-- FUNCTION: get_course_progress_overview
-- DESCRIPTION:
--   Returns a full JSON overview of the current authenticated user's progress in a published course,
--   including:
--     - Course metadata
--     - Organization information
--     - User progress metrics (if enrolled)
--     - Chapter and lesson structure with per-lesson progress
--     - Recent activity (recently completed blocks)
--     - Additional statistics like total time spent, average score, and first activity timestamp
--
-- NOTES:
--   - Uses auth.uid() to determine the authenticated user.
--   - If the user is not enrolled, progress will be excluded from the response.
-- =====================================================================================================

create or replace function public.get_course_progress_overview(
  p_published_course_id uuid  -- ID of the published course
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result json;             -- Final JSON response
  v_course_exists boolean;   -- Flag: course exists and is active
  v_user_id uuid := auth.uid(); -- Authenticated user
  v_user_enrolled boolean;   -- Flag: user is enrolled and enrollment is active
begin
  -- Validate course ID
  if p_published_course_id is null then
    raise exception 'Published course ID cannot be null';
  end if;

  -- Check if the course exists and is active
  select exists (
    select 1
    from public.published_courses
    where id = p_published_course_id and is_active = true
  ) into v_course_exists;

  if not v_course_exists then
    raise exception 'Course not found or not active';
  end if;

  -- Check if the user is actively enrolled in the course
  select exists (
    select 1
    from public.course_enrollments ce
    where ce.published_course_id = p_published_course_id
      and ce.user_id = v_user_id
      and ce.is_active = true
      and (ce.expires_at is null or ce.expires_at > now())
  ) into v_user_enrolled;

  -- Build the response JSON
  select json_build_object(
    -- Course metadata
    'course', json_build_object(
      'id', pc.id,
      'name', pc.name,
      'description', pc.description,
      'image_url', pc.image_url,
      'blur_hash', pc.blur_hash,
      'total_chapters', pc.total_chapters,
      'total_lessons', pc.total_lessons,
      'total_blocks', pc.total_blocks,
      'average_rating', pc.average_rating,
      'total_reviews', pc.total_reviews,
      'total_enrollments', pc.total_enrollments,
      'published_at', pc.published_at
    ),

    -- Organization metadata
    'organization', json_build_object(
      'id', org.id,
      'name', org.name,
      'handle', org.handle,
      'description', org.description,
      'website_url', org.website_url,
      'avatar_url', org.avatar_url,
      'blur_hash', org.blur_hash,
      'banner_url', org.banner_url,
      'banner_blur_hash', org.banner_blur_hash,
      'is_public', org.is_public,
      'is_verified', org.is_verified,
      'email', org.email,
      'phone_number', org.phone_number,
      'location', org.location,
      'tier', org.tier,
      'created_at', org.created_at
    ),

    -- Overall progress
    'overall_progress', case
      when v_user_enrolled then
        coalesce(
          json_build_object(
            'total_blocks', cp.total_blocks,
            'completed_blocks', cp.completed_blocks,
            'total_lessons', cp.total_lessons,
            'completed_lessons', cp.completed_lessons,
            'total_chapters', cp.total_chapters,
            'completed_chapters', cp.completed_chapters,
            'total_weight', cp.total_weight,
            'completed_weight', cp.completed_weight,
            'progress_percentage', cp.progress_percentage,
            'total_lesson_weight', cp.total_lesson_weight,
            'completed_lesson_weight', cp.completed_lesson_weight,
            'lesson_progress_percentage', cp.lesson_progress_percentage,
            'completed_at', cp.completed_at,
            'updated_at', cp.updated_at
          ),
          json_build_object(
            'total_blocks', pc.total_blocks,
            'completed_blocks', 0,
            'total_lessons', pc.total_lessons,
            'completed_lessons', 0,
            'total_chapters', pc.total_chapters,
            'completed_chapters', 0,
            'total_weight', 0,
            'completed_weight', 0,
            'progress_percentage', 0,
            'total_lesson_weight', 0,
            'completed_lesson_weight', 0,
            'lesson_progress_percentage', 0,
            'completed_at', null,
            'updated_at', null
          )
        )
      else null
    end,

    -- Chapters and lesson progress
    'chapters', (
      select json_agg(
        json_build_object(
          'id', chapter_data.id,
          'name', chapter_data.name,
          'description', chapter_data.description,
          'position', chapter_data.position,
          'total_lessons', chapter_data.total_lessons,
          'total_blocks', chapter_data.total_blocks,
          'completed_lessons', case when v_user_enrolled then coalesce(chapter_progress.completed_lessons, 0) else null end,
          'completed_blocks', case when v_user_enrolled then coalesce(chapter_progress.completed_blocks, 0) else null end,
          'progress_percentage', case
            when v_user_enrolled then
              coalesce(
                case
                  when chapter_data.total_blocks > 0 then
                    round((coalesce(chapter_progress.completed_blocks, 0)::numeric / chapter_data.total_blocks * 100), 2)
                  else 0
                end,
                0
              )
            else null
          end,
          'lessons', chapter_data.lessons
        )
        order by chapter_data.position
      )
      from (
        select
          (chapter->>'id')::uuid as id,
          chapter->>'name' as name,
          chapter->>'description' as description,
          (chapter->>'position')::integer as position,
          (chapter->>'total_lessons')::integer as total_lessons,
          (chapter->>'total_blocks')::integer as total_blocks,
          json_agg(
            json_build_object(
              'id', (lesson->>'id')::uuid,
              'name', lesson->>'name',
              'position', (lesson->>'position')::integer,
              'total_blocks', (lesson->>'total_blocks')::integer,
              'lesson_type', lesson->'lesson_types',
              'progress', case
                when v_user_enrolled then
                  coalesce(lp_data.progress_data, json_build_object(
                    'total_blocks', (lesson->>'total_blocks')::integer,
                    'completed_blocks', 0,
                    'total_weight', 0,
                    'completed_weight', 0,
                    'progress_percentage', 0,
                    'completed_at', null
                  ))
                else null
              end
            )
            order by (lesson->>'position')::integer
          ) as lessons
        from public.published_courses pc_inner
        cross join jsonb_array_elements((pc_inner.course_structure_overview->'chapters')::jsonb) as chapter
        cross join jsonb_array_elements((chapter->'lessons')::jsonb) as lesson
        left join lateral (
          select json_build_object(
            'total_blocks', lp.total_blocks,
            'completed_blocks', lp.completed_blocks,
            'total_weight', lp.total_weight,
            'completed_weight', lp.completed_weight,
            'progress_percentage', lp.progress_percentage,
            'completed_at', lp.completed_at,
            'updated_at', lp.updated_at
          ) as progress_data
          from public.lesson_progress lp
          where v_user_enrolled
            and lp.user_id = v_user_id
            and lp.published_course_id = p_published_course_id
            and lp.lesson_id = (lesson->>'id')::uuid
        ) lp_data on true
        where pc_inner.id = p_published_course_id
        group by 
          (chapter->>'id')::uuid,
          chapter->>'name',
          chapter->>'description',
          (chapter->>'position')::integer,
          (chapter->>'total_lessons')::integer,
          (chapter->>'total_blocks')::integer
      ) chapter_data
      left join lateral (
        select 
          count(*) filter (where lp.completed_at is not null) as completed_lessons,
          sum(lp.completed_blocks) as completed_blocks
        from jsonb_array_elements(chapter_data.lessons::jsonb) as lesson_item
        left join public.lesson_progress lp 
          on v_user_enrolled
          and lp.lesson_id = ((lesson_item->>'id')::uuid)
          and lp.user_id = v_user_id
          and lp.published_course_id = p_published_course_id
      ) chapter_progress on true
    ),

    -- Recent activity (last 10 completed blocks)
    'recent_activity', case
      when v_user_enrolled then (
        select json_agg(
          json_build_object(
            'block_id', sub.block_id,
            'lesson_id', sub.lesson_id,
            'chapter_id', sub.chapter_id,
            'completed_at', sub.completed_at,
            'time_spent_seconds', sub.time_spent_seconds,
            'earned_score', sub.earned_score
          )
        )
        from (
          select bp.block_id, bp.lesson_id, bp.chapter_id, bp.completed_at,
                 bp.time_spent_seconds, bp.earned_score
          from public.block_progress bp
          where bp.user_id = v_user_id
            and bp.published_course_id = p_published_course_id
            and bp.is_completed = true
          order by bp.completed_at desc
          limit 10
        ) sub
      )
      else null
    end,

    -- Statistics section
    'statistics', case
      when v_user_enrolled then
        json_build_object(
          'total_time_spent', coalesce((
            select sum(bp.time_spent_seconds)
            from public.block_progress bp
            where bp.user_id = v_user_id
              and bp.published_course_id = p_published_course_id
          ), 0),
          'average_score', coalesce((
            select round(avg(bp.earned_score), 2)
            from public.block_progress bp
            where bp.user_id = v_user_id
              and bp.published_course_id = p_published_course_id
              and bp.earned_score is not null
          ), null),
          'completion_streak', 0, -- TODO: implement streak logic
          'started_at', (
            select min(bp.started_at)
            from public.block_progress bp
            where bp.user_id = v_user_id
              and bp.published_course_id = p_published_course_id
          )
        )
      else null
    end
  ) into v_result
  from public.published_courses pc
  inner join public.organizations org on pc.organization_id = org.id -- Added join with organizations table
  left join public.course_progress cp 
    on v_user_enrolled 
    and cp.published_course_id = pc.id 
    and cp.user_id = v_user_id
  where pc.id = p_published_course_id
    and pc.is_active = true;

  return v_result;
end;
$$;

-- Grant usage to authenticated users only
grant execute on function public.get_course_progress_overview(uuid) to authenticated;