import type { NewLessonSubmitValues } from '@gonasi/schemas/lessons';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

/**
 * Creates a new lesson in the database under a given chapter.
 *
 * Determines the next available position within the chapter
 * and inserts the lesson with that position.
 *
 * @param supabase - The Supabase client instance.
 * @param lessonData - The lesson data including name, courseId, and chapterId.
 * @returns A promise resolving to an API response indicating success or failure.
 *
 * @example
 * ```ts
 * const result = await createLessonDetails(supabase, {
 *   name: "React Basics",
 *   courseId: "course_123",
 *   chapterId: "chapter_456",
 * });
 *
 * if (result.success) {
 *   console.log("Lesson created.");
 * } else {
 *   console.error("Error:", result.message);
 * }
 * ```
 */
export const createLessonDetails = async (
  supabase: TypedSupabaseClient,
  lessonData: NewLessonSubmitValues,
): Promise<ApiResponse<{ id: string }>> => {
  const userId = await getUserId(supabase);
  const { name, courseId, chapterId, lessonType } = lessonData;

  try {
    // Get the highest current position for lessons in this chapter
    const { data: maxPositionResult, error: positionError } = await supabase
      .from('lessons')
      .select('position')
      .eq('chapter_id', chapterId)
      .order('position', { ascending: false })
      .limit(1)
      .single();

    if (positionError && positionError.code !== 'PGRST116') {
      // Ignore "no rows found" error (PGRST116)
      return {
        success: false,
        message: 'Could not determine the next lesson position.',
      };
    }

    const nextPosition = maxPositionResult?.position != null ? maxPositionResult.position + 1 : 0;

    // Insert the new lesson with calculated position
    const { data, error: insertError } = await supabase
      .from('lessons')
      .insert({
        name,
        lesson_type_id: lessonType,
        course_id: courseId,
        chapter_id: chapterId,
        position: nextPosition,
        created_by: userId,
        updated_by: userId,
      })
      .select('id')
      .single();

    if (insertError) {
      return {
        success: false,
        message: 'Failed to create the lesson.',
      };
    }

    return {
      success: true,
      message: 'Lesson created successfully.',
      data,
    };
  } catch (err) {
    console.error('Unexpected error in createLessonDetails:', err);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
    };
  }
};
