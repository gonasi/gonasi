import type { EditCourseSubcategorySubmitValues } from '@gonasi/schemas/courses';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

/**
 * Updates the subcategory of a course in the database.
 *
 * @param {TypedSupabaseClient} supabase - The Supabase client instance.
 * @param {EditCourseCategorySubmitValues} data - The course category update data.
 * @returns {Promise<ApiResponse>} A promise resolving to the API response indicating success or failure.
 */
export const editCourseSubcategory = async (
  supabase: TypedSupabaseClient,
  data: EditCourseSubcategorySubmitValues,
): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);

  const { courseId, subcategory } = data;

  try {
    const { error: updateError } = await supabase
      .from('courses')
      .update({
        subcategory_id: subcategory,
        updated_by: userId,
      })
      .match({
        id: courseId,
        created_by: userId,
      });

    if (updateError) {
      return {
        success: false,
        message: 'Unable to update the course subcategory. Please verify your input and try again.',
      };
    }

    return {
      success: true,
      message: 'Course subcategory has been successfully updated.',
    };
  } catch (error) {
    console.error('Unexpected error while updating the course subcategory:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
    };
  }
};
