import { getUserId } from '../../auth';
import type { TypedSupabaseClient } from '../../client';

export async function fetchLessonsCompletionStatusByCourse(
  supabase: TypedSupabaseClient,
  courseId: string,
) {
  const userId = await getUserId(supabase);

  const { data, error } = await supabase
    .from('lessons_progress')
    .select('id, is_complete, course_id, lesson_id')
    .match({ user_id: userId, course_id: courseId });

  if (error || !data) {
    console.error(
      `Failed to fetch completion status for course ${courseId}:`,
      error?.message || 'No data returned',
    );
    return null;
  }

  return data;
}
