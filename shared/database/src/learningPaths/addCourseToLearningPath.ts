import type { AddCourseToLearningPathSubmitValues } from '@gonasi/schemas/learningPaths';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';
import { checkUserOwnsPathway } from './checkUserOwnsPathway';

/**
 * Assigns a course to a learning path by updating its `pathway_id` in the database.
 *
 * Only allows updates for courses created by the currently authenticated user.
 *
 * @param supabase - The Supabase client instance used for authentication and database access.
 * @param data - An object containing the course ID and target learning path ID.
 * @returns A promise resolving to an `ApiResponse` indicating whether the update was successful.
 */
export const addCourseToLearningPath = async (
  supabase: TypedSupabaseClient,
  data: AddCourseToLearningPathSubmitValues,
): Promise<ApiResponse> => {
  try {
    const userId = await getUserId(supabase);
    const { courseId, learningPathId } = data;

    // Validate that the learning path belongs to the user
    const ownsPathway = await checkUserOwnsPathway(supabase, learningPathId);
    if (!ownsPathway) {
      return { success: false, message: 'You can only update a pathway you own.' };
    }

    // Update the course with the new pathway_id
    const { error: updateError } = await supabase
      .from('courses')
      .update({ pathway_id: learningPathId, updated_by: userId })
      .match({ id: courseId, created_by: userId });

    if (updateError) {
      return {
        success: false,
        message:
          'Failed to assign course to learning path. Please check permissions and try again.',
      };
    }

    return {
      success: true,
      message: 'Course successfully assigned to the selected learning path.',
    };
  } catch (error) {
    console.error('Unexpected error while assigning course to pathway:', error);
    return {
      success: false,
      message: 'Something went wrong while assigning the course. Please try again later.',
    };
  }
};
