import type { NewLessonSubmitValues } from '@gonasi/schemas/lessons';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

/**
 * Creates a new lesson entry in the database.
 *
 * @param supabase - Supabase client instance
 * @param lessonData - New lesson form values
 * @returns Result with success status and created lesson ID or error message
 */
export const createLessonDetails = async (
  supabase: TypedSupabaseClient,
  lessonData: NewLessonSubmitValues,
): Promise<ApiResponse<{ id: string }>> => {
  try {
    // Get the ID of the currently logged-in user
    const userId = await getUserId(supabase);

    // Pull relevant values from the form data
    const { name, courseId, chapterId, lessonType } = lessonData;

    // Insert the new lesson into the database
    const { data, error } = await supabase
      .from('lessons')
      .insert({
        name,
        lesson_type_id: lessonType,
        course_id: courseId,
        chapter_id: chapterId,
        created_by: userId,
        updated_by: userId,
      })
      .select('id')
      .single();

    // Handle known errors from the insert operation
    if (error) {
      return {
        success: false,
        message: "Couldn't save the lesson—give it another shot.",
      };
    }

    // Success!
    return {
      success: true,
      message: 'Nice! Your lesson is all set.',
      data,
    };
  } catch (err) {
    console.error('createLessonDetails threw:', err);
    return {
      success: false,
      message: 'Something went sideways. Try again in a bit.',
    };
  }
};
