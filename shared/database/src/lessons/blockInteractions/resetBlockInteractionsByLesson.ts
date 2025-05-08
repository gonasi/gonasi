import { getUserId } from '../../auth';
import type { TypedSupabaseClient } from '../../client';
import type { ApiResponse } from '../../types';

/**
 * Deletes all block interaction entries for the current user in a given lesson.
 *
 * @param supabase - An authenticated Supabase client instance.
 * @param lessonId - The ID of the lesson whose interactions should be deleted.
 * @returns A promise that resolves to an ApiResponse indicating success or failure.
 */
export const resetBlockInteractionsByLesson = async (
  supabase: TypedSupabaseClient,
  lessonId: string,
): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);

  try {
    const { error } = await supabase
      .from('block_interactions')
      .delete()
      .match({ user_id: userId, lesson_id: lessonId });

    if (error) {
      console.log('Error deleting block interactions:', error);
      return {
        success: false,
        message: 'Unable to reset lesson. Please try again later.',
      };
    }

    return {
      success: true,
      message: 'Lesson reset successfully.',
    };
  } catch (err) {
    console.error('Error in resetBlockInteractionsByLesson:', err);
    return {
      success: false,
      message: 'Unexpected server error. Please contact support if the issue persists.',
    };
  }
};
