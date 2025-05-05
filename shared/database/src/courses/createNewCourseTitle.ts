import type { NewCourseTitleSubmitValues } from '@gonasi/schemas/courses';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

/**
 * Creates a new course title in the database.
 *
 * @param {TypedSupabaseClient} supabase - The Supabase client instance.
 * @param {NewCourseTitleSubmitValues} courseTitle - The course title data containing name and userId.
 * @returns {Promise<ApiResponse<{ id: string }>>} - The response indicating success or failure with optional course ID data.
 *
 * @example
 * ```ts
 * const result = await createNewCourseTitle(supabase, { name: "React Basics", userId: "12345" });
 * if (result.success) {
 *   console.log("Created course ID:", result.data);
 * } else {
 *   console.error("Error:", result.message);
 * }
 * ```
 */
export const createNewCourseTitle = async (
  supabase: TypedSupabaseClient,
  courseData: NewCourseTitleSubmitValues,
): Promise<ApiResponse<{ id: string }>> => {
  const userId = await getUserId(supabase);

  const { name, companyId } = courseData;

  console.log({
    name,
    company_id: companyId,
    created_by: userId,
    updated_by: userId,
  });

  try {
    const { data, error } = await supabase
      .from('courses')
      .insert({
        name,
        company_id: companyId,
        created_by: userId,
        updated_by: userId,
      })
      .select('id')
      .single();

    if (error || !data) {
      console.error('Supabase insert error:', error);
      return { success: false, message: error.message || 'Failed to create course title.' };
    }

    return { success: true, message: 'Course title created successfully.', data };
  } catch (err) {
    console.error('Unexpected error in createNewCourseTitle:', err);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
    };
  }
};
