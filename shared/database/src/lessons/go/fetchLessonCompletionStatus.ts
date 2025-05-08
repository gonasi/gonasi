import { getUserId } from '../../auth';
import type { TypedSupabaseClient } from '../../client';

export async function fetchLessonCompletionStatus(supabase: TypedSupabaseClient, lessonId: string) {
  const userId = await getUserId(supabase);

  const { data, error } = await supabase
    .from('lesson_progress')
    .select('is_complete')
    .match({ user_id: userId, lesson_id: lessonId })
    .single();

  if (error || !data) {
    console.error(
      `Failed to fetch completion status for course ${lessonId}:`,
      error?.message || 'No data returned',
    );
    return null;
  }

  return data;
}
