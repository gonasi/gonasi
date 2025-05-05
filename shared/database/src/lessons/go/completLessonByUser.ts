import { getUserId } from '../../auth';
import type { TypedSupabaseClient } from '../../client';
import type { ApiResponse } from '../../types';

export const completeLessonByUser = async (
  supabase: TypedSupabaseClient,
  courseId: string,
  chapterId: string,
  lessonId: string,
): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);

  try {
    const { data: existingProgress } = await supabase
      .from('lessons_progress')
      .select('node_progress')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .maybeSingle();

    // Step 1: Mark the current lesson as complete
    const { error } = await supabase.from('lessons_progress').upsert(
      {
        user_id: userId,
        course_id: courseId,
        chapter_id: chapterId,
        lesson_id: lessonId,
        is_complete: true,
        node_progress: existingProgress?.node_progress ?? {},
      },
      { onConflict: 'user_id, lesson_id' },
    );

    if (error) {
      console.log('Error is: ', error);
      return {
        success: false,
        message: 'Could not complete lesson.',
      };
    }

    return {
      success: true,
      message: 'Lesson completed successfully.',
    };
  } catch (err) {
    console.error('Unexpected error in completeLessonByUser:', err);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
    };
  }
};
