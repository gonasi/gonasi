import type { DeleteChapterSubmitValues } from '@gonasi/schemas/courseChapters';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

/**
 * Deletes a chapter by its ID if it was created by the specified user.
 *
 * @param {TypedSupabaseClient} supabase - The Supabase client instance.
 * @param {DeleteChapterSubmitValues} chapterData - The chapter ID and user ID for deletion.
 * @returns {Promise<ApiResponse>} The response indicating success or failure.
 */
export const deleteUserChapterById = async (
  supabase: TypedSupabaseClient,
  chapterData: DeleteChapterSubmitValues,
): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);
  const { chapterId } = chapterData;

  try {
    const { error } = await supabase.rpc('delete_chapter', {
      p_chapter_id: chapterId,
      p_deleted_by: userId,
    });

    if (error) {
      return {
        success: false,
        message: 'Unable to delete the chapter. Please try again.',
      };
    }

    return { success: true, message: 'Chapter successfully deleted.' };
  } catch (error) {
    console.error('Error deleting chapter:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
    };
  }
};
