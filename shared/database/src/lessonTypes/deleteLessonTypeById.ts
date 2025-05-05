import type { DeleteLessonTypes } from '@gonasi/schemas/lessonTypes';

import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

/**
 * Deletes a lesson type from the database using its ID.
 *
 * @param supabase - The Supabase client instance.
 * @param lessonTypeData - Object containing the `id` of the lesson type to delete.
 * @returns A promise that resolves to an ApiResponse indicating success or failure.
 */
export const deleteLessonTypeById = async (
  supabase: TypedSupabaseClient,
  lessonTypeData: DeleteLessonTypes,
): Promise<ApiResponse> => {
  const { id } = lessonTypeData;

  try {
    const { error } = await supabase.from('lesson_types').delete().eq('id', id);

    if (error) {
      return {
        success: false,
        message: 'Unable to delete the lesson type.',
      };
    }

    return {
      success: true,
      message: 'Lesson type deleted successfully.',
    };
  } catch {
    return {
      success: false,
      message: 'Unexpected error occurred. Please try again.',
    };
  }
};
