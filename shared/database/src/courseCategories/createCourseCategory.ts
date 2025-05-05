import type { NewCourseCategorySubmitValues } from '@gonasi/schemas/courseCategories';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

/**
 * Creates a new course category in the `course_categories` table.
 */
export const createCourseCategory = async (
  supabase: TypedSupabaseClient,
  { name, description }: NewCourseCategorySubmitValues,
): Promise<
  ApiResponse<{
    id: string;
    name: string;
    description: string;
    created_by: string;
    updated_by: string;
  }>
> => {
  try {
    const userId = await getUserId(supabase);

    const { data, error } = await supabase
      .from('course_categories')
      .insert({
        name,
        description,
        created_by: userId,
        updated_by: userId,
      })
      .select()
      .single();

    if (error || !data) {
      return {
        success: false,
        message: error?.message || 'Failed to create course category.',
      };
    }
    return {
      success: true,
      message: 'Course category successfully created',
      data,
    };
  } catch {
    return {
      success: false,
      message: 'Something went wrong while creating the course category.',
    };
  }
};
