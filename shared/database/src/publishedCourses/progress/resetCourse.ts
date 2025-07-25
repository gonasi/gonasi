import { getUserId } from '../../auth';
import type { TypedSupabaseClient } from '../../client';

interface ResetCourseArgs {
  supabase: TypedSupabaseClient;
  courseId: string;
}

export const resetCourse = async ({ supabase, courseId }: ResetCourseArgs) => {
  const userId = await getUserId(supabase);

  try {
    const { error } = await supabase
      .from('course_progress')
      .delete()
      .match({ user_id: userId, published_course_id: courseId });

    if (error) {
      console.error('Failed to reset course progress:', error);
      return {
        success: false,
        message: 'Could not reset your course progress. Please try again shortly.',
      };
    }

    return {
      success: true,
      message: 'Your course progress has been reset.',
    };
  } catch (err) {
    console.error('Unexpected error during course reset:', err);
    return {
      success: false,
      message: 'Something went wrong. Please contact support if this keeps happening.',
    };
  }
};
