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
  const { courseId, name, description, requiresPayment } = chapterData;

  try {
    // Step 1: Get current max position for the course
    const { data: maxPositionResult, error: positionError } = await supabase
      .from('chapters')
      .select('position')
      .eq('course_id', courseId)
      .order('position', { ascending: false })
      .limit(1)
      .single();

    if (positionError && positionError.code !== 'PGRST116') {
      // PGRST116 = no rows found, ignore if it's just an empty course
      return {
        success: false,
        message: 'Could not determine the chapter position.',
      };
    }

    const nextPosition = maxPositionResult?.position != null ? maxPositionResult.position + 1 : 0;

    // Step 2: Insert new chapter with the next position
    const { data, error: insertError } = await supabase
      .from('chapters')
      .insert({
        course_id: courseId,
        name,
        description,
        requires_payment: requiresPayment,
        position: nextPosition,
        created_by: userId,
        updated_by: userId,
      })
      .select('id')
      .single();

    if (insertError) {
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
