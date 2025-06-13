import type { DeleteCoursePricingTierSchemaTypes } from '@gonasi/schemas/coursePricing';

import { getUserId } from '../../auth';
import type { TypedSupabaseClient } from '../../client';

/**
 * Deletes a lesson by its ID if it was created by the specified user.
 *
 * @param {TypedSupabaseClient} supabase - The Supabase client instance.
 * @param {DeleteCoursePricingTierSchemaTypes} lessonData - The lesson ID and user ID for deletion.
 * @returns {Promise<ApiResponse>} The response indicating success or failure.
 */
export const deleteCoursePricingTier = async (
  supabase: TypedSupabaseClient,
  data: DeleteCoursePricingTierSchemaTypes,
) => {
  const userId = await getUserId(supabase);
  const { coursePricingTierId } = data;

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
