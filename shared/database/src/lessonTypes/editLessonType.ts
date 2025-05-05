import type { EditLessonTypeSubmitValues } from '@gonasi/schemas/lessonTypes';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

/**
 * Updates an existing lesson type in the database.
 *
 * @param supabase - The Supabase client instance.
 * @param lessonTypeData - The lesson type data to be updated, including the ID.
 * @returns An object indicating whether the update was successful and a message.
 */
export const editLessonType = async (
  supabase: TypedSupabaseClient,
  lessonTypeData: EditLessonTypeSubmitValues,
): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);
  const { name, description, lucideIcon, lessonTypeId, bgColor } = lessonTypeData;

  try {
    const { error: updateError } = await supabase
      .from('lesson_types')
      .update({
        name,
        description,
        lucide_icon: lucideIcon,
        bg_color: bgColor,
        updated_by: userId,
      })
      .eq('id', lessonTypeId);

    if (updateError) {
      return {
        success: false,
        message: `Failed to update lesson type: ${updateError.message}`,
      };
    }

    return {
      success: true,
      message: 'Lesson type updated successfully.',
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return {
      success: false,
      message: 'An unexpected error occurred while updating the lesson type.',
    };
  }
};
