import type { EditLessonSubmitValues } from '@gonasi/schemas/lessons';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

/**
 * Updates the title of a lesson in the database.
 *
 * @param {TypedSupabaseClient} supabase - The Supabase client instance.
 * @param {EditLessonSubmitValues} lessonData - The lesson data containing the new title, lesson ID, and user ID.
 * @returns {Promise<ApiResponse>} A promise resolving to an API response indicating success or failure.
 */
export const editLessonDetails = async (
  supabase: TypedSupabaseClient,
  lessonData: EditLessonSubmitValues,
): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);

  const { name, lessonId, lessonType } = lessonData;

  try {
    const { error: updateError } = await supabase
      .from('lessons')
      .update({ name, lesson_type_id: lessonType, updated_by: userId })
      .match({ id: lessonId, created_by: userId });

    if (updateError) {
      return { success: false, message: `Unable to update lesson title: ${updateError.message}` };
    }

    return { success: true, message: 'Lesson title updated successfully.' };
  } catch (error) {
    console.error('Unexpected error while updating lesson title:', error);
    return { success: false, message: 'An unexpected error occurred. Please try again.' };
  }
};
