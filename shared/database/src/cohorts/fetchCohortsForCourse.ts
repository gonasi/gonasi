import type { TypedSupabaseClient } from '../client';
import type { Database } from '../schema';

type Cohort = Database['public']['Tables']['cohorts']['Row'];

/**
 * Fetches all cohorts for a specific published course, ordered by creation date (newest first).
 *
 * @param supabase - The Supabase client instance
 * @param publishedCourseId - The ID of the published course
 * @returns A promise that resolves to an array of cohorts
 *
 * @example
 * ```ts
 * const cohorts = await fetchCohortsForCourse(supabase, "course-uuid");
 * console.log("Found cohorts:", cohorts.length);
 * ```
 */
export async function fetchCohortsForCourse(
  supabase: TypedSupabaseClient,
  publishedCourseId: string,
): Promise<Cohort[]> {
  const { data, error } = await supabase
    .from('cohorts')
    .select('*')
    .eq('published_course_id', publishedCourseId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[fetchCohortsForCourse] Error:', error.message);
    throw error;
  }

  return data || [];
}
