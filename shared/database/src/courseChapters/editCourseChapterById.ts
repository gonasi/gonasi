import type { EditChapterSubmitValues } from '@gonasi/schemas/courseChapters';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

/**
 * Updates an existing course chapter in the database.
 *
 * @param {TypedSupabaseClient} supabase - The Supabase client instance.
 * @param {EditChapterSubmitValues} chapterData - The updated chapter details.
 * @returns {Promise<ApiResponse>} A response indicating success or failure.
 */
export const editCourseChapterById = async (
  supabase: TypedSupabaseClient,
  chapterData: EditChapterSubmitValues,
): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);

  const { chapterId, name, description, requiresPayment } = chapterData;

  try {
    const { error } = await supabase
      .from('chapters')
      .update({
        name,
        description,
        requires_payment: requiresPayment,
        updated_by: userId,
      })
      .match({
        id: chapterId,
        created_by: userId,
      });

    if (error) {
      return { success: false, message: 'Failed to update course chapter.' };
    }

    return { success: true, message: 'Course chapter updated successfully.' };
  } catch {
    return { success: false, message: 'An error occurred while updating the course chapter.' };
  }
};
