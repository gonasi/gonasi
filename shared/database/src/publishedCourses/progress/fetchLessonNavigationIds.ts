import type z from 'zod';

import { LessonNavigationResponseSchema } from '@gonasi/schemas/publish/lesson-navigation';

import { getUserId } from '../../auth';
import type { TypedSupabaseClient } from '../../client';

type LessonNavigation = z.infer<typeof LessonNavigationResponseSchema>;

interface FetchLessonNavigationIdsArgs {
  supabase: TypedSupabaseClient;
  courseId: string;
  lessonId: string;
}

/**
 * Fetches lesson navigation metadata for a given course and lesson.
 * Includes previous, next, and next-incomplete ("continue") lesson metadata.
 */
export async function fetchLessonNavigationIds({
  supabase,
  courseId,
  lessonId,
}: FetchLessonNavigationIdsArgs): Promise<LessonNavigation | null> {
  const userId = await getUserId(supabase);

  const { data, error } = await supabase.rpc('get_lesson_navigation_ids', {
    p_published_course_id: courseId,
    p_current_lesson_id: lessonId,
    p_user_id: userId,
  });

  if (error) {
    console.error('[fetchLessonNavigationIds] Supabase RPC error:', error.message);
    return null;
  }

  if (!data) {
    console.warn(`[fetchLessonNavigationIds] No data for course ${courseId}, lesson ${lessonId}`);
    return null;
  }

  const parsed = LessonNavigationResponseSchema.safeParse(data);

  if (!parsed.success) {
    console.error('[fetchLessonNavigationIds] Invalid response schema:', parsed.error);
    return null;
  }

  return parsed.data;
}
