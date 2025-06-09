import type { NewCourseTitleSchemaTypes } from '@gonasi/schemas/courses';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

/**
 * Adds a new course title to the database.
 *
 * @param {TypedSupabaseClient} supabase - The Supabase client instance.
 * @param {NewCourseTitleSchemaTypes} courseData - Info about the course (name, userId).
 * @returns {Promise<ApiResponse<{ id: string }>>} - Success or failure response, with course ID if all goes well.
 *
 * @example
 * ```ts
 * const result = await createNewCourseTitle(supabase, { name: "React Basics", userId: "12345" });
 * if (result.success) {
 *   console.log("Nice! Course ID:", result.data);
 * } else {
 *   console.error("Something went wrong:", result.message);
 * }
 * ```
 */
export const createNewCourseTitle = async (
  supabase: TypedSupabaseClient,
  courseData: NewCourseTitleSchemaTypes,
): Promise<ApiResponse<{ id: string }>> => {
  const { name } = courseData;

  const userId = await getUserId(supabase);

  try {
    const { data, error } = await supabase
      .from('courses')
      .insert({
        name,
        created_by: userId,
        updated_by: userId,
      })
      .select('id')
      .single();

    if (error || !data) {
      console.error('Supabase insert error:', error);
      return { success: false, message: error.message || 'Couldn’t add the course title.' };
    }

    return { success: true, message: 'Course title added successfully!', data };
  } catch (err) {
    console.error('Unexpected error in createNewCourseTitle:', err);
    return {
      success: false,
      message: 'Something went wrong—try again in a bit.',
    };
  }
};
