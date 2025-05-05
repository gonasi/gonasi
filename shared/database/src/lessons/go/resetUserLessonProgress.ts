import { getUserId } from '../../auth';
import type { TypedSupabaseClient } from '../../client';
import type { ApiResponse } from '../../types';

/**
 * Resets a user's lesson progress by clearing page breaks, interactive elements,
 * and marking the lesson as incomplete.
 *
 * @param {TypedSupabaseClient} supabase - The Supabase client instance.
 * @param {string} lessonId - The ID of the lesson to reset progress for.
 * @returns {Promise<ApiResponse>} - An object indicating success or failure.
 */
export async function resetUserLessonProgress(
  supabase: TypedSupabaseClient,
  lessonId: string,
): Promise<ApiResponse> {
  try {
    const userId = await getUserId(supabase);

    const { data, error } = await supabase
      .from('lessons_progress')
      .select('id')
      .match({ lesson_id: lessonId, user_id: userId })
      .single();

    if (error || !data) {
      return {
        success: false,
        message: 'No lesson progress found to reset.',
      };
    }

    const { error: updateError } = await supabase
      .from('lessons_progress')
      .update({
        node_progress: {},
        is_complete: false,
      })
      .match({ lesson_id: lessonId, user_id: userId });

    if (updateError) {
      return {
        success: false,
        message: `Failed to reset lesson progress: ${updateError.message}`,
      };
    }

    return {
      success: true,
      message: 'Lesson progress has been successfully reset.',
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return {
      success: false,
      message: 'An unexpected error occurred while resetting lesson progress.',
    };
  }
}
