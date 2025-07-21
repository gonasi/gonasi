-- ====================================================================================
-- FUNCTION: update_progress_cascade_on_block_change
-- DESCRIPTION: Handles cascading updates when block progress changes
--              Updates lesson_progress, course_progress, and determines next IDs
-- ====================================================================================
CREATE OR REPLACE FUNCTION public.update_progress_cascade_on_block_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  course_structure jsonb;
  lesson_blocks_data jsonb;
  chapter_lessons_data jsonb;
  
  -- Lesson progress calculations
  lesson_total_blocks integer;
  lesson_completed_blocks integer;
  lesson_is_completed boolean;
  
  -- Chapter progress calculations  
  chapter_total_lessons integer;
  chapter_completed_lessons integer;
  chapter_is_completed boolean;
  
  -- Course progress calculations
  course_total_blocks integer;
  course_completed_blocks integer;
  course_total_lessons integer;
  course_completed_lessons integer;
  course_total_chapters integer;
  course_completed_chapters integer;
  course_is_completed boolean;
  
  -- Next navigation IDs
  next_block_id uuid;
  next_lesson_id uuid;
  next_chapter_id uuid;
  
BEGIN
  -- Only process if this is an INSERT or completion status changed
  IF TG_OP = 'INSERT' OR 
     (TG_OP = 'UPDATE' AND OLD.is_completed IS DISTINCT FROM NEW.is_completed) THEN
    
    -- Get the published course structure
    SELECT course_structure_content 
    INTO course_structure
    FROM public.published_course_structure_content 
    WHERE id = NEW.published_course_id;
    
    IF course_structure IS NULL THEN
      RAISE EXCEPTION 'Course structure not found for published_course_id: %', NEW.published_course_id;
    END IF;
    
    -- =================================================================================
    -- 1. UPDATE LESSON PROGRESS
    -- =================================================================================
    
    -- Get lesson blocks and calculate progress
    SELECT 
      jsonb_array_length(lesson_obj->'blocks') as total_blocks,
      COUNT(bp.id) FILTER (WHERE bp.is_completed = true) as completed_blocks
    INTO lesson_total_blocks, lesson_completed_blocks
    FROM jsonb_path_query(
      course_structure,
      '$.chapters[*].lessons[*] ? (@.id == $lesson_id)',
      jsonb_build_object('lesson_id', NEW.lesson_id::text)
    ) as lesson_obj
    LEFT JOIN public.block_progress bp ON (
      bp.user_id = NEW.user_id 
      AND bp.published_course_id = NEW.published_course_id
      AND bp.lesson_id = NEW.lesson_id
      AND bp.is_completed = true
    )
    GROUP BY lesson_obj;
    
    lesson_is_completed := (lesson_completed_blocks >= lesson_total_blocks);
    
    -- Upsert lesson progress
    INSERT INTO public.lesson_progress (
      user_id, 
      published_course_id, 
      lesson_id,
      total_blocks,
      completed_blocks,
      completed_at
    )
    VALUES (
      NEW.user_id,
      NEW.published_course_id,
      NEW.lesson_id,
      lesson_total_blocks,
      lesson_completed_blocks,
      CASE WHEN lesson_is_completed THEN timezone('utc', now()) ELSE NULL END
    )
    ON CONFLICT (user_id, published_course_id, lesson_id)
    DO UPDATE SET
      completed_blocks = EXCLUDED.completed_blocks,
      completed_at = CASE 
        WHEN EXCLUDED.completed_blocks >= lesson_progress.total_blocks 
          AND lesson_progress.completed_at IS NULL 
        THEN timezone('utc', now())
        WHEN EXCLUDED.completed_blocks < lesson_progress.total_blocks
        THEN NULL
        ELSE lesson_progress.completed_at
      END,
      updated_at = timezone('utc', now());
    
    -- =================================================================================
    -- 2. UPDATE COURSE PROGRESS
    -- =================================================================================
    
    -- Calculate course-wide progress
    WITH course_stats AS (
      SELECT 
        -- Count total items from structure
        (
          SELECT SUM(jsonb_array_length(lesson_obj->'blocks'))
          FROM jsonb_path_query(course_structure, '$.chapters[*].lessons[*]') as lesson_obj
        ) as total_blocks_in_course,
        (
          SELECT COUNT(*)
          FROM jsonb_path_query(course_structure, '$.chapters[*].lessons[*]') as lesson_obj
        ) as total_lessons_in_course,
        (
          SELECT jsonb_array_length(course_structure->'chapters')
        ) as total_chapters_in_course,
        
        -- Count completed items from progress tables
        COUNT(bp.id) FILTER (WHERE bp.is_completed = true) as completed_blocks_by_user,
        COUNT(lp.id) FILTER (WHERE lp.completed_at IS NOT NULL) as completed_lessons_by_user,
        COUNT(DISTINCT CASE 
          WHEN chapter_lesson_counts.lessons_in_chapter = chapter_lesson_counts.completed_lessons_in_chapter 
          THEN chapter_lesson_counts.chapter_id 
        END) as completed_chapters_by_user
        
      FROM public.block_progress bp
      LEFT JOIN public.lesson_progress lp ON (
        lp.user_id = bp.user_id 
        AND lp.published_course_id = bp.published_course_id 
        AND lp.lesson_id = bp.lesson_id
      )
      LEFT JOIN (
        -- Count lessons per chapter and completed lessons per chapter
        SELECT 
          (chapter_obj->>'id')::uuid as chapter_id,
          jsonb_array_length(chapter_obj->'lessons') as lessons_in_chapter,
          COUNT(lp2.id) FILTER (WHERE lp2.completed_at IS NOT NULL) as completed_lessons_in_chapter
        FROM jsonb_array_elements(course_structure->'chapters') as chapter_obj
        LEFT JOIN jsonb_array_elements(chapter_obj->'lessons') as lesson_obj ON true
        LEFT JOIN public.lesson_progress lp2 ON (
          lp2.user_id = NEW.user_id
          AND lp2.published_course_id = NEW.published_course_id
          AND lp2.lesson_id = (lesson_obj->>'id')::uuid
          AND lp2.completed_at IS NOT NULL
        )
        GROUP BY chapter_obj
      ) chapter_lesson_counts ON true
      WHERE bp.user_id = NEW.user_id 
        AND bp.published_course_id = NEW.published_course_id
    )
    SELECT 
      total_blocks_in_course,
      completed_blocks_by_user,
      total_lessons_in_course,
      completed_lessons_by_user,
      total_chapters_in_course,
      completed_chapters_by_user
    INTO 
      course_total_blocks,
      course_completed_blocks,
      course_total_lessons,
      course_completed_lessons,
      course_total_chapters,
      course_completed_chapters
    FROM course_stats;
    
    course_is_completed := (
      course_completed_blocks >= course_total_blocks AND
      course_completed_lessons >= course_total_lessons AND
      course_completed_chapters >= course_total_chapters
    );
    
    -- Upsert course progress
    INSERT INTO public.course_progress (
      user_id,
      published_course_id,
      total_blocks,
      completed_blocks,
      total_lessons,
      completed_lessons,
      total_chapters,
      completed_chapters,
      completed_at
    )
    VALUES (
      NEW.user_id,
      NEW.published_course_id,
      course_total_blocks,
      course_completed_blocks,
      course_total_lessons,
      course_completed_lessons,
      course_total_chapters,
      course_completed_chapters,
      CASE WHEN course_is_completed THEN timezone('utc', now()) ELSE NULL END
    )
    ON CONFLICT (user_id, published_course_id)
    DO UPDATE SET
      completed_blocks = EXCLUDED.completed_blocks,
      completed_lessons = EXCLUDED.completed_lessons,
      completed_chapters = EXCLUDED.completed_chapters,
      completed_at = CASE 
        WHEN EXCLUDED.completed_blocks >= course_progress.total_blocks 
          AND EXCLUDED.completed_lessons >= course_progress.total_lessons
          AND EXCLUDED.completed_chapters >= course_progress.total_chapters
          AND course_progress.completed_at IS NULL
        THEN timezone('utc', now())
        WHEN NOT (EXCLUDED.completed_blocks >= course_progress.total_blocks 
          AND EXCLUDED.completed_lessons >= course_progress.total_lessons
          AND EXCLUDED.completed_chapters >= course_progress.total_chapters)
        THEN NULL
        ELSE course_progress.completed_at
      END,
      updated_at = timezone('utc', now());
  
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- =================================================================================
-- TRIGGER: Apply cascading updates on block progress changes
-- =================================================================================
DROP TRIGGER IF EXISTS trg_block_progress_cascade_update ON public.block_progress;

CREATE TRIGGER trg_block_progress_cascade_update
  AFTER INSERT OR UPDATE ON public.block_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_progress_cascade_on_block_change();