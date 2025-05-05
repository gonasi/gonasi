import type { DeleteLessonSubmitValues } from '@gonasi/schemas/lessons';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

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
): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);
  const { lessonId } = lessonData;

  try {
    // Step 1: Get the lessons's chapter_id and position
    const { data: lesson, error: fetchError } = await supabase
      .from('lessons')
      .select('chapter_id, position')
      .match({ id: lessonId, created_by: userId })
      .single();

    if (fetchError || !lesson) {
      return {
        success: false,
        message: "Lesson not found or you don't have permission to delete it.",
      };
    }

    const { chapter_id, position: deletedPosition } = lesson;

    // Step 2: Delete the lesson
    const { error: deleteError } = await supabase
      .from('lessons')
      .delete()
      .match({ id: lessonId, created_by: userId });

    if (deleteError) {
      return {
        success: false,
        message: 'Unable to delete the lesson. Please try again.',
      };
    }

    // Step 3: Fetch lessons with higher position
    const { data: lessonsToUpdate, error: fetchLessonsError } = await supabase
      .from('lessons')
      .select('id, position')
      .eq('chapter_id', chapter_id)
      .gt('position', deletedPosition);

    if (fetchLessonsError) {
      return {
        success: false,
        message: 'Lesson deleted, but failed to fetch remaining lessons for reordering.',
      };
    }

    // Step 4: Decrement their positions
    for (const lesson of lessonsToUpdate || []) {
      await supabase
        .from('lessons')
        .update({ position: (lesson.position || 0) - 1 })
        .eq('id', lesson.id);
    }

    return { success: true, message: 'Lesson successfully deleted.' };
  } catch (error) {
    console.error('Unexpected error while deleting lesson:', error);
    return { success: false, message: 'An unexpected error occurred. Please try again later.' };
  }
};
