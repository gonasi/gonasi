import type { EditCourseCategoryDetailsSubmitValues } from '@gonasi/schemas/courseCategories';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

export const editCourseCategoryDetails = async (
  supabase: TypedSupabaseClient,
  courseCategoryData: EditCourseCategoryDetailsSubmitValues,
): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);

  const { name, description, courseCategoryId } = courseCategoryData;

  try {
    const { error: updateError } = await supabase
      .from('course_categories')
      .update({
        name,
        description,
        updated_by: userId,
      })
      .eq('id', courseCategoryId);

    if (updateError) {
      return { success: false, message: updateError.message };
    }

    return {
      success: true,
      message: 'Course category successfully updated',
    }; // Return success response with inserted pathway data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return {
      success: false,
      message: 'Something went wrong. Please try again',
    }; // Return error response
  }
};
