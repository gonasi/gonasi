import type { EditLessonContentSubmitValues } from '@gonasi/schemas/lessons';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

/**
 * Updates a lesson's content in the database.
 *
 * This function verifies the user identity, then updates the content of the specified
 * lesson only if the user is the original creator.
 *
 * @param supabase - The Supabase client instance.
 * @param lessonData - Object containing the lesson ID and updated content.
 * @returns A promise resolving to an ApiResponse indicating whether the update succeeded.
 */
export const editLessonContent = async (
  supabase: TypedSupabaseClient,
  lessonData: EditLessonContentSubmitValues,
): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);
  const { lessonId, content } = lessonData;

  try {
    const { error: updateError } = await supabase
      .from('lessons')
      .update({
        content,
        updated_by: userId,
      })
      .match({
        id: lessonId,
        created_by: userId,
      });

    if (updateError) {
      return {
        success: false,
        message: `Failed to update lesson: ${updateError.message}`,
      };
    }

    // reset all lesson progress
    const { error: resetError } = await supabase
      .from('lessons_progress')
      .update({
        node_progress: {},
        is_complete: false,
      })
      .eq('lesson_id', lessonId);

    if (resetError) {
      return {
        success: false,
        message: `Failed to reset lesson progress: ${resetError.message}`,
      };
    }

    return {
      success: true,
      message: 'Lesson updated successfully.',
    };
  } catch (error) {
    console.error('Unexpected error while updating lesson:', error);
    return {
      success: false,
      message: 'An unexpected error occurred while updating the lesson.',
    };
  }
};
