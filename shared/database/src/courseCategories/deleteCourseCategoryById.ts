import type { DeleteCourseCategoryTypes } from '@gonasi/schemas/courseCategories';

import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

/**
 * Deletes a course category from the database by its ID.
 *
 * @param supabase - An instance of the Supabase client.
 * @param courseCategoryData - The course category data containing the `id` to delete.
 * @returns A promise resolving to an ApiResponse indicating the result.
 */
export const deleteCourseCategoryById = async (
  supabase: TypedSupabaseClient,
  courseCategoryData: DeleteCourseCategoryTypes,
): Promise<ApiResponse> => {
  const { id } = courseCategoryData;

  try {
    const { error } = await supabase.from('course_categories').delete().eq('id', id);

    if (error) {
      return {
        success: false,
        message: 'Failed to delete course category.',
      };
    }

    return {
      success: true,
      message: 'Course category deleted successfully.',
    };
  } catch {
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
};
