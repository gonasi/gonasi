import type { DeleteCourseSubCategorySubmitValues } from '@gonasi/schemas/courseSubCategories';

import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

export const deleteCourseSubCategoryById = async (
  supabase: TypedSupabaseClient,
  courseSubCategoryData: DeleteCourseSubCategorySubmitValues,
): Promise<ApiResponse> => {
  const { id: courseSubCategoryId } = courseSubCategoryData;

  try {
    const { error: deleteErrors } = await supabase
      .from('course_sub_categories')
      .delete()
      .eq('id', courseSubCategoryId);

    if (deleteErrors) {
      return { success: false, message: deleteErrors.message };
    }

    return {
      success: true,
      message: 'Course sub-category successfully deleted',
    }; // Return success response with inserted pathway data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return {
      success: false,
      message: 'Something went wrong. Please try again',
    }; // Return error response
  }
};
