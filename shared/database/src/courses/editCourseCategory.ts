import type { EditCourseCategorySubmitValues } from '@gonasi/schemas/courses';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

/**
 * Updates a course's category and clears the subcategory.
 *
 * @param {TypedSupabaseClient} supabase - Supabase client instance.
 * @param {EditCourseCategorySubmitValues} data - Includes course ID and the new category.
 * @returns {Promise<ApiResponse>} Success or error info.
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
        message:
          "Hmm, couldn't update the category. Double-check the info and give it another shot.",
      };
    }

    return {
      success: true,
      message: 'Category updated! All set.',
    };
  } catch (error) {
    console.error('Error updating course category:', error);
    return {
      success: false,
      message: 'Something went wrong on our end. Try again in a bit.',
    };
  }
};
