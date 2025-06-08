import type { ChapterPositionUpdateArraySchemaTypes } from '@gonasi/schemas/courseChapters';

import type { TypedSupabaseClient } from '../client';

interface UpdateChapterPositionsParams {
  supabase: TypedSupabaseClient;
  courseId: string;
  chapterPositions: ChapterPositionUpdateArraySchemaTypes;
}

export async function updateChapterPositions({
  supabase,
  courseId,
  chapterPositions,
}: UpdateChapterPositionsParams) {
  try {
    const { error } = await supabase.rpc('reorder_chapters', {
      p_course_id: courseId,
      chapter_positions: chapterPositions,
    });

    if (error) {
      console.error('[updateChapterPositions] Supabase RPC error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });

      return {
        success: false,
        message: 'Hmm, couldn’t update the chapter order. Want to give it another shot?',
      };
    }

    return { success: true };
  } catch (err) {
    console.error('[updateChapterPositions] Unexpected error:', err);
    return {
      success: false,
      message: 'Something went sideways while reordering chapters. Please try again in a bit.',
    };
  }
}
