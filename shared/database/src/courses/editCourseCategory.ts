import type { EditCourseCategorySubmitValues } from '@gonasi/schemas/courses';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

/**
 * Updates the category of a course and sets subcategory to null in the database.
 *
 * @param {TypedSupabaseClient} supabase - The Supabase client instance.
 * @param {EditCourseCategorySubmitValues} data - The data containing course ID, user ID, and new category ID.
 * @returns {Promise<ApiResponse>} A promise resolving to the API response indicating success or failure.
 */
export const editCourseCategory = async (
  supabase: TypedSupabaseClient,
  data: EditCourseCategorySubmitValues,
): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);

  const { courseId, category } = data;

  try {
    const { error: updateError } = await supabase
      .from('courses')
      .update({
        category_id: category,
        subcategory_id: null,
        updated_by: userId,
      })
      .match({
        id: courseId,
        created_by: userId,
      });

    if (updateError) {
      return {
        success: false,
        message: 'Failed to update the course category. Please check your input and try again.',
      };
    }

    return {
      success: true,
      message: 'Course category updated successfully.',
    };
  } catch (error) {
    console.error('Error updating course category:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
    };
  }
};
