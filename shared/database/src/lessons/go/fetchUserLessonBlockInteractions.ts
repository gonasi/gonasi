import { getUserId } from '../../auth';
import type { TypedSupabaseClient } from '../../client';

interface FetchLessonBlockInteractionsParams {
  supabase: TypedSupabaseClient;
  lessonId: string;
}

/**
 * Fetches all block interactions for the currently authenticated user within a given lesson.
 *
 * @param {FetchLessonBlockInteractionsParams} params - Parameters for the fetch operation.
 * @param {TypedSupabaseClient} params.supabase - The Supabase client instance.
 * @param {string} params.lessonId - The ID of the lesson.
 * @returns {Promise<object[] | null>} - Returns an array of block interactions, or null on error.
 */
export async function fetchUserLessonBlockInteractions({
  supabase,
  lessonId,
}: FetchLessonBlockInteractionsParams): Promise<object[] | null> {
  const userId = await getUserId(supabase);
  if (!userId) {
    console.error('User ID could not be retrieved.');
    return null;
  }

  const { data, error } = await supabase.from('block_interactions').select('*').match({
    user_id: userId,
    lesson_id: lessonId,
  });

  if (error || !data) {
    console.error(
      `Failed to fetch block interactions for lesson ID ${lessonId} and user ID ${userId}:`,
      error?.message ?? 'No data found',
    );
    return null;
  }

  return data;
}
