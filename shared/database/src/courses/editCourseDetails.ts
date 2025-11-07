import type { EditCourseDetailsSubmitValues } from '@gonasi/schemas/courses';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

interface EditCourseDetailsArgs {
  supabase: TypedSupabaseClient;
  data: EditCourseDetailsSubmitValues;
}

/**
 * Updates course details, including the name, description, and subscription price.
 *
 * @param args - Object containing the Supabase client and input data.
 * @returns A promise resolving to an ApiResponse indicating success or failure.
 */
export const editCourseDetails = async ({
  supabase,
  data,
}: EditCourseDetailsArgs): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);

  const { courseId, name, description, visibility } = data;

  try {
    const { error: updateError } = await supabase
      .from('courses')
      .update({
        name,
        description,
        visibility,
        updated_by: userId,
      })
      .match({
        id: courseId,
        created_by: userId,
      });

    if (updateError) {
      console.log('[updateError]: ', updateError);
      return {
        success: false,
        message: 'Failed to update course details. Please check the provided data and try again.',
      };
    }

    return {
      success: true,
      message: 'Course details updated successfully.',
    };
  } catch (error) {
    console.error('Unexpected error while updating course details:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
    };
  }
};
