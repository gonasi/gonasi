import type { EditCourseSubCategorySubmitValues } from '@gonasi/schemas/courseSubCategories';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

export const editCourseSubCategory = async (
  supabase: TypedSupabaseClient,
  courseSubCategoryData: EditCourseSubCategorySubmitValues,
): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);

  const { name, courseSubCategoryId } = courseSubCategoryData;

  try {
    const { error: updateError } = await supabase
      .from('course_sub_categories')
      .update({
        name,
        updated_by: userId,
      })
      .eq('id', courseSubCategoryId);

    if (updateError) {
      return { success: false, message: updateError.message };
    }

    return {
      success: true,
      message: 'Course sub-category successfully updated',
    }; // Return success response with inserted pathway data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return {
      success: false,
      message: 'Something went wrong. Please try again',
    }; // Return error response
  }
};
