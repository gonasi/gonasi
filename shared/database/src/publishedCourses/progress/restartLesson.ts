import { getUserId } from '../../auth';
import type { TypedSupabaseClient } from '../../client';
import type { ApiResponse } from '../../types';

interface RestartLessonArgs {
  supabase: TypedSupabaseClient;
  lessonId: string;
}

export const restartLesson = async ({
  supabase,
  lessonId,
}: RestartLessonArgs): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);

  try {
    const { error } = await supabase
      .from('lesson_progress')
      .delete()
      .match({ user_id: userId, lesson_id: lessonId });

    if (error) {
      console.log('Error deleting block interactions:', error);
      return {
        success: false,
        message: 'Unable to reset lesson. Please try again later.',
      };
    }

    return {
      success: true,
      message: 'Lesson reset successfully.',
    };
  } catch (err) {
    console.error('Error in restartLesson:', err);
    return {
      success: false,
      message: 'Unexpected server error. Please contact support if the issue persists.',
    };
  }
};
