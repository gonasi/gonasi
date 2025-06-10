import type { DeleteLessonSubmitValues } from '@gonasi/schemas/lessons';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';

/**
 * Deletes a lesson by its ID if it was created by the specified user.
 *
 * @param {TypedSupabaseClient} supabase - The Supabase client instance.
 * @param {DeleteLessonSubmitValues} lessonData - The lesson ID and user ID for deletion.
 * @returns {Promise<ApiResponse>} The response indicating success or failure.
 */
export const deleteUserLessonById = async (
  supabase: TypedSupabaseClient,
  lessonData: DeleteLessonSubmitValues,
) => {
  const userId = await getUserId(supabase);
  const { lessonId } = lessonData;

  try {
    const { error } = await supabase.rpc('delete_lesson', {
      p_lesson_id: lessonId,
      p_deleted_by: userId,
    });

    if (error) {
      return {
        success: false,
        message: 'Unable to delete the lesson. Please try again.',
      };
    }

    return { success: true, message: 'Lesson successfully deleted.' };
  } catch (error) {
    console.error('Unexpected error while deleting lesson:', error);
    return { success: false, message: 'An unexpected error occurred. Please try again later.' };
  }
};
