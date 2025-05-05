import type { NewCourseSubCategorySubmitValues } from '@gonasi/schemas/courseSubCategories';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

export const createCourseSubCategory = async (
  supabase: TypedSupabaseClient,
  courseSubCategoryData: NewCourseSubCategorySubmitValues,
): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);

  const { name, courseCategoryId } = courseSubCategoryData;

  try {
    const { error: insertError } = await supabase
      .from('course_sub_categories')
      .insert({
        category_id: courseCategoryId,
        name,
        created_by: userId,
        updated_by: userId,
      })
      .select();

    if (insertError) {
      return { success: false, message: 'Could not create course subcategory' };
    }

    return {
      success: true,
      message: 'Course subcategory successfully created',
    }; // Return success response with inserted pathway data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return {
      success: false,
      message: 'Something went wrong. Please try again',
    }; // Return error response
  }
};
