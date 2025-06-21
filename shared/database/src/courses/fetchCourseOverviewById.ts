import type { TypedSupabaseClient } from '../client';
import { THUMBNAILS_BUCKET } from '../constants';

/**
 * Fetches overview about a course by its ID.
 *
 * @param {TypedSupabaseClient} supabase - The Supabase client instance.
 * @param {string} courseId - The ID of the course to fetch details for.
 * @returns {Promise<object | null>} - Returns the course details object if found, otherwise `null`.
 *
 * @example
 * ```ts
 * const courseOverview = await fetchCourseOverviewById(supabase, "course123");
 * if (courseOverview) {
 *   console.log("Course Name:", courseOverview.name);
 * } else {
 *   console.log("Course not found.");
 * }
 * ```
 */
export async function fetchCourseOverviewById(supabase: TypedSupabaseClient, courseId: string) {
  const { data, error } = await supabase
    .from('courses')
    .select(
      `
      id,
      name,
      description,  
      image_url,
      blur_hash,
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
    .from(THUMBNAILS_BUCKET)
    .createSignedUrl(data.image_url, 3600);

  return {
    ...data,
    signedUrl: signedUrlData?.signedUrl || '',
  };
}
