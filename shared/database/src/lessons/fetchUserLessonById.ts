import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';

/**
 * Fetches a lesson by its ID for a specific user.
 *
 * @param {TypedSupabaseClient} supabase - The Supabase client instance.
 * @param {string} lessonId - The unique identifier of the lesson.
 * @returns {Promise<{ id: string; name: string, lesson_type_id: string } | null>} The lesson data if found, otherwise `null`.
 */
export async function fetchUserLessonById(supabase: TypedSupabaseClient, lessonId: string) {
  const userId = await getUserId(supabase);

  const { data, error } = await supabase
    .from('lessons')
    .select('id, name, lesson_type_id, lesson_types(name, description)')
    .match({ id: lessonId, created_by: userId })
    .single();

  if (error || !data) {
    console.error('Failed to fetch lesson:', error?.message || 'Lesson not found');
    return null;
  }

  return data;
}
