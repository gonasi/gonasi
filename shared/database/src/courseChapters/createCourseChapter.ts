import type { NewChapterSubmitValues } from '@gonasi/schemas/courseChapters';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

/**
 * Creates a new course chapter in the database.
 *
 * @param {TypedSupabaseClient} supabase - The Supabase client instance.
 * @param {NewChapterSubmitValues} chapterData - The data for the new course chapter.
 * @returns {Promise<ApiResponse>} A response object indicating success or failure.
 */
export const createCourseChapter = async (
  supabase: TypedSupabaseClient,
  chapterData: NewChapterSubmitValues,
): Promise<ApiResponse<{ id: string }>> => {
  const userId = await getUserId(supabase);
  const { courseId, name, description } = chapterData;

  try {
    const { data, error: insertError } = await supabase
      .from('chapters')
      .insert({
        course_id: courseId,
        name,
        description,
        created_by: userId,
        updated_by: userId,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('createCourseChapter: Could not create new course chapter.', insertError);
      return { success: false, message: 'Could not create new course chapter.' };
    }

    return { success: true, message: 'Course chapter successfully created.', data };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return {
      success: false,
      message: 'An error occurred while creating the course chapter.',
    };
  }
};
