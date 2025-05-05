import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';

/**
 * Fetches a course by its ID and associated pathway ID, scoped to the authenticated user.
 *
 * @param supabase - The Supabase client instance.
 * @param courseId - The ID of the course to fetch.
 * @param pathwayId - The ID of the pathway the course is associated with.
 * @returns A promise that resolves to the course data (`{ id: string }`) if found, otherwise `null`.
 *
 * @example
 * ```ts
 * const course = await fetchCourseByPathwayId(supabase, "course123", "pathway456");
 * if (course) {
 *   console.log("Course ID:", course.id);
 * } else {
 *   console.log("Course not found or access denied.");
 * }
 * ```
 */
export async function fetchCourseByPathwayId(
  supabase: TypedSupabaseClient,
  courseId: string,
  pathwayId: string,
): Promise<{ id: string; name: string } | null> {
  const userId = await getUserId(supabase);

  const { data, error } = await supabase
    .from('courses')
    .select('id, name')
    .match({
      id: courseId,
      created_by: userId,
      pathway_id: pathwayId,
    })
    .single();

  if (error || !data) {
    console.error('Error fetching course:', error?.message || 'Course not found');
    return null;
  }

  return data;
}
