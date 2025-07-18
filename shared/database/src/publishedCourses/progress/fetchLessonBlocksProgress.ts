import { getUserId } from '../../auth';
import type { TypedSupabaseClient } from '../../client';

interface FetchLessonBlocksProgressArgs {
  supabase: TypedSupabaseClient;
  publishedCourseId: string;
  lessonId: string;
}

export async function fetchLessonBlocksProgress({
  supabase,
  publishedCourseId,
  lessonId,
}: FetchLessonBlocksProgressArgs) {
  const userId = await getUserId(supabase);

  const { data, error } = await supabase
    .from('block_progress')
    .select('id, block_id, is_completed, completed_at')
    .eq('published_course_id', publishedCourseId)
    .eq('lesson_id', lessonId)
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to fetch lesson blocks progress:', error);
    return null;
  }

  return data;
}
