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
    // Step 1: Get the chapter's course_id and position
    const { data: chapter, error: fetchError } = await supabase
      .from('chapters')
      .select('course_id, position')
      .match({ id: chapterId, created_by: userId })
      .single();

    if (fetchError || !chapter) {
      return {
        success: false,
        message: "Chapter not found or you don't have permission to delete it.",
      };
    }

    const { course_id, position: deletedPosition } = chapter;

    // Step 2: Delete the chapter
    const { error: deleteError } = await supabase
      .from('chapters')
      .delete()
      .match({ id: chapterId, created_by: userId });

    if (deleteError) {
      return {
        success: false,
        message: 'Unable to delete the chapter. Please try again.',
      };
    }

    // Step 3: Fetch chapters with higher position
    const { data: chaptersToUpdate, error: fetchChaptersError } = await supabase
      .from('chapters')
      .select('id, position')
      .eq('course_id', course_id)
      .gt('position', deletedPosition);

    if (fetchChaptersError) {
      return {
        success: false,
        message: 'Chapter deleted, but failed to fetch remaining chapters for reordering.',
      };
    }

    // Step 4: Decrement their positions
    for (const chapter of chaptersToUpdate || []) {
      await supabase
        .from('chapters')
        .update({ position: (chapter.position || 0) - 1 })
        .eq('id', chapter.id);
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
