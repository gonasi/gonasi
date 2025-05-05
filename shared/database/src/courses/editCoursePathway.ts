import type { EditCoursePathwaySubmitValues } from '@gonasi/schemas/courses';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

/**
 * Updates the pathway of a course in the database.
 *
 * @param {TypedSupabaseClient} supabase - The Supabase client instance.
 * @param {EditCourseCategorySubmitValues} data - The course category update data.
 * @returns {Promise<ApiResponse>} A promise resolving to the API response indicating success or failure.
 */
export const editCoursePathway = async (
  supabase: TypedSupabaseClient,
  data: EditCoursePathwaySubmitValues,
): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);

  const { courseId, pathway } = data;

  try {
    const { error: updateError } = await supabase
      .from('courses')
      .update({
        pathway_id: pathway,
        updated_by: userId,
      })
      .match({
        id: courseId,
        created_by: userId,
      });

    if (updateError) {
      return {
        success: false,
        message: 'Unable to update the course pathway. Please verify your input and try again.',
      };
    }

    return {
      success: true,
      message: 'Course pathway has been successfully updated.',
    };
  } catch (error) {
    console.error('Unexpected error while updating the course pathway:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
    };
  }
};
