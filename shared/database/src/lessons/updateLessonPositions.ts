import type { LessonPositionUpdateArray } from '@gonasi/schemas/lessons';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';

/**
 * Reorders lessons using a Supabase Postgres function to ensure atomic update.
 *
 * @param supabase - The Supabase client
 * @param reorderedLessons - Lessons in new order
 * @returns Success result with optional error message
 */
export async function updateLessonPositions(
  supabase: TypedSupabaseClient,
  reorderedLessons: LessonPositionUpdateArray,
): Promise<{ success: boolean; message?: string }> {
  if (reorderedLessons.length === 0) {
    return {
      success: true,
      message: 'No lessons to reorder.',
    };
  }

  const userId = await getUserId(supabase);

  const enrichedLessons = reorderedLessons.map((lesson) => ({
    ...lesson,
    updated_by: userId,
  }));

  try {
    const { error } = await supabase.rpc('reorder_lessons', {
      lessons: enrichedLessons,
    });

    if (error) {
      console.error('Error calling reorder_lessons:', error);
      return {
        success: false,
        message: 'Could not update lesson order. Please try again.',
      };
    }

    return {
      success: true,
    };
  } catch (err) {
    console.error('Unexpected error during reorder:', err);
    return {
      success: false,
      message: 'Something went wrong while reordering chapters.',
    };
  }
}
