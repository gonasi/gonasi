import type { NewLessonTypeSubmitValues } from '@gonasi/schemas/lessonTypes';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

/**
 * Creates a new lesson type entry in the `lesson_types` table.
 *
 * @param supabase - A typed Supabase client instance.
 * @param input - The lesson type data to be inserted.
 * @param input.name - The name of the lesson type.
 * @param input.description - A short description of the lesson type.
 * @param input.lucideIcon - The name of the associated Lucide icon.
 * @returns An `ApiResponse` containing the newly created lesson type's ID or an error message.
 */
export const createLessonType = async (
  supabase: TypedSupabaseClient,
  { name, description, lucideIcon, bgColor }: NewLessonTypeSubmitValues,
): Promise<ApiResponse<{ id: string }>> => {
  try {
    const userId = await getUserId(supabase);

    const { data, error } = await supabase
      .from('lesson_types')
      .insert({
        name,
        description,
        lucide_icon: lucideIcon,
        bg_color: bgColor,
        created_by: userId,
        updated_by: userId,
      })
      .select()
      .single();

    if (error || !data) {
      console.log(error);
      return {
        success: false,
        message: error?.message || 'Failed to create lesson type.',
      };
    }

    return {
      success: true,
      message: 'Lesson type created successfully.',
      data,
    };
  } catch {
    return {
      success: false,
      message: 'An unexpected error occurred while creating the lesson type.',
    };
  }
};
