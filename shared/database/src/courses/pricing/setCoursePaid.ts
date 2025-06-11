import { getUserId } from '../../auth';
import type { TypedSupabaseClient } from '../../client';

/**
 * Marks a course as paid for the current user using a Supabase RPC call.
 *
 * @param supabase - A typed Supabase client instance
 * @param courseId - The ID of the course to mark as paid
 * @returns An object indicating success or failure and a message
 */
export async function setCoursePaid({
  supabase,
  courseId,
}: {
  supabase: TypedSupabaseClient;
  courseId: string;
}) {
  // Retrieve the current user's ID
  const userId = await getUserId(supabase);

  // Call the stored procedure to mark the course as paid
  const { error } = await supabase.rpc('set_course_paid', {
    p_course_id: courseId,
    p_user_id: userId,
  });

  if (error) {
    console.error('Failed to mark course as paid:', error.message);
    return {
      success: false,
      message: error.message || 'Unable to mark the course as paid.',
    };
  }

  return {
    success: true,
    message: 'Course successfully marked as paid.',
  };
}
