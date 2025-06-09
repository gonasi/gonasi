import type { LessonPositionUpdateArraySchemaTypes } from '@gonasi/schemas/lessons';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';

interface UpdateLessonPositionsParams {
  supabase: TypedSupabaseClient;
  chapterId: string;
  lessonPositions: LessonPositionUpdateArraySchemaTypes;
}

export async function updateLessonPositions({
  supabase,
  chapterId,
  lessonPositions,
}: UpdateLessonPositionsParams) {
  const userId = await getUserId(supabase);

  try {
    const { error } = await supabase.rpc('reorder_lessons', {
      p_chapter_id: chapterId,
      lesson_positions: lessonPositions,
      p_updated_by: userId,
    });

    if (error) {
      console.error('[updateLessonPositions] Supabase RPC error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return {
        success: false,
        message: 'Could not update lesson order. Please try again.',
      };
    }

    return {
      success: true,
    };
  } catch (err) {
    console.error('[updateLessonPositions] Unexpected error:', err);
    return {
      success: false,
      message: 'Something went wrong while reordering chapters.',
    };
  }
}
