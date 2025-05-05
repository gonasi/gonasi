import type { TypedSupabaseClient } from '../client';
import { COURSES_BUCKET } from '../constants';

/**
 * Fetches detailed information about a course by its ID.
 *
 * @param {TypedSupabaseClient} supabase - The Supabase client instance.
 * @param {string} courseId - The ID of the course to fetch details for.
 * @returns {Promise<object | null>} - Returns the course details object if found, otherwise `null`.
 *
 * @example
 * ```ts
 * const courseDetails = await fetchCourseDetailsById(supabase, "course123");
 * if (courseDetails) {
 *   console.log("Course Name:", courseDetails.name);
 * } else {
 *   console.log("Course not found.");
 * }
 * ```
 */
export async function fetchCourseDetailsById(supabase: TypedSupabaseClient, courseId: string) {
  const { data, error } = await supabase
    .from('courses')
    .select(
      `
      id,
      name,
      description,  
      image_url,
      monthly_subscription_price,
      created_at,
      updated_at,
      created_by,
      updated_by,
      course_categories(id, name),
      course_sub_categories(id, name),
      pathways(id, name),
      created_by_profile:profiles!courses_created_by_fkey (id, username, email, full_name, avatar_url),
      updated_by_profile:profiles!courses_updated_by_fkey (id, username, email, full_name, avatar_url)
    `,
    )
    .eq('id', courseId)
    .single();

  if (error || !data) {
    console.error('Error fetching course:', error?.message || 'Course not found');
    return null;
  }

  if (!data.image_url) {
    return {
      ...data,
      signedUrl: '',
    };
  }

  const { data: signedUrlData } = await supabase.storage
    .from(COURSES_BUCKET)
    .createSignedUrl(data.image_url, 3600);

  return {
    ...data,
    signedUrl: signedUrlData?.signedUrl || '',
  };
}
