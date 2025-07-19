import { getUserId } from '../../auth';
import type { TypedSupabaseClient } from '../../client';

interface FetchLessonBlocksProgressArgs {
  supabase: TypedSupabaseClient;
  publishedCourseId: string;
  publishedLessonId: string;
}

// Inferred return type
export type FetchLessonBlocksProgressReturnType = NonNullable<
  Awaited<ReturnType<typeof fetchLessonBlocksProgress>>
>;

export async function fetchLessonBlocksProgress({
  supabase,
  publishedCourseId,
  publishedLessonId,
}: FetchLessonBlocksProgressArgs) {
  const userId = await getUserId(supabase);
  if (!userId) return null;

  const { data, error } = await supabase
    .from('block_progress')
    .select(
      `
        id,
        user_id,
        block_id,
        lesson_id,
        is_completed,
        score,
        attempts,
        state,
        last_response,
        feedback,
        started_at,
        completed_at,
        time_spent_seconds,
        plugin_type
      `,
    )
    .eq('published_course_id', publishedCourseId)
    .eq('lesson_id', publishedLessonId)
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to fetch lesson blocks progress:', error);
    return null;
  }

  return data;
}
