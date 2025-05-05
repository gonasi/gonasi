import type { RemoveCourseToLearningPathSubmitValues } from '@gonasi/schemas/learningPaths';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

/**
 * Unlinks a course from a learning path by setting its `pathway_id` to `null`.
 *
 * @param supabase - Supabase client instance.
 * @param data - Object containing the course ID and learning path ID.
 * @returns A response indicating whether the operation succeeded.
 *
 * @remarks
 * The course can only be unlinked if the user is its creator and the `pathway_id` matches the given ID.
 */
export const removeCourseFromLearningPath = async (
  supabase: TypedSupabaseClient,
  data: RemoveCourseToLearningPathSubmitValues,
): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);
  const { courseId, learningPathId } = data;

  try {
    const { error: updateError } = await supabase
      .from('courses')
      .update({ pathway_id: null, updated_by: userId })
      .match({ id: courseId, pathway_id: learningPathId, created_by: userId });

    if (updateError) {
      return {
        success: false,
        message: `Could not remove course from learning path: ${updateError.message}`,
      };
    }

    return {
      success: true,
      message: 'Course successfully removed from the learning path.',
    };
  } catch (error) {
    console.error('Error removing course from learning path:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
};
