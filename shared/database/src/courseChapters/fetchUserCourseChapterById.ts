import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';

/**
 * Fetches a course chapter by its ID and the user who created it.
 *
 * @param {TypedSupabaseClient} supabase - The Supabase client instance.
 * @param {string} chapterId - The ID of the course chapter.
 * @returns {Promise<object | null>} The chapter data if found, otherwise null.
 */
export async function fetchUserCourseChapterById(supabase: TypedSupabaseClient, chapterId: string) {
  const userId = await getUserId(supabase);

  try {
    const { data } = await supabase
      .from('chapters')
      .select(
        `
        id,
        course_id,
        name,
        description,
        requires_payment,
        position
      `,
      )
      .match({ id: chapterId, created_by: userId })
      .single();

    return data;
  } catch (error) {
    console.error(
      'Error fetching course chapter:',
      (error as Error).message ?? 'Chapter not found',
    );
    return null;
  }
}
