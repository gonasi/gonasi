import type { TypedSupabaseClient } from '../../client';
import { THUMBNAILS_BUCKET } from '../../constants';

/**
 * Retrieves the full details of a specific course by its ID.
 * Includes metadata, related categories, lessons, chapters, and author profiles.
 * Also generates a signed URL for the course image (if available).
 *
 * @param {TypedSupabaseClient} supabase - An instance of the Supabase client.
 * @param {string} courseId - The unique identifier of the course to retrieve.
 * @returns {Promise<object | null>} - A course object with all details and a signed image URL, or `null` if not found or an error occurs.
 *
 * @example
 * ```ts
 * const course = await fetchPublishedCourseDetailsById(supabase, "course123");
 * if (course) {
 *   console.log(course.name); // e.g., "Beginner's Guide to Driving"
 * } else {
 *   console.log("Course not found.");
 * }
 * ```
 */
export async function fetchPublishedCourseDetailsById(
  supabase: TypedSupabaseClient,
  courseId: string,
) {
  const { data, error } = await supabase
    .from('courses')
    .select(
      ` 
      id,
      name,
      description,  
      image_url,
      monthly_subscription_price,
      status,
      created_at,
      updated_at,
      created_by,
      updated_by,
      course_categories(id, name),
      course_sub_categories(id, name),
      pathways(id, name), 
      chapters(
        id,
        course_id,
        name,
        description,
        created_at,
        updated_at,
        created_by,
        position,
        lessons(
          id, 
          name, 
          course_id, 
          chapter_id, 
          created_at, 
          created_by, 
          updated_by, 
          position,
          lesson_types(
            id, 
            name,
            description,
            lucide_icon,
            bg_color
          )
        )
      ), 
      lessons(id, position),
      created_by_profile:profiles!courses_created_by_fkey (id, username, email, full_name, avatar_url),
      updated_by_profile:profiles!courses_updated_by_fkey (id, username, email, full_name, avatar_url)
    `,
    )
    .match({ id: courseId, status: 'draft' }) // TODO: Update to { status: 'published' } when ready
    .order('position', { ascending: true, referencedTable: 'chapters' })
    .order('position', { referencedTable: 'chapters.lessons' })
    .single();

  if (error || !data) {
    console.error('Error fetching course:', error?.message || 'Course not found');
    return null;
  }

  const chapters_count = data.chapters?.length || 0;
  const lesson_count = data.lessons?.length || 0;

  if (!data.image_url) {
    return {
      ...data,
      signedUrl: '',
      lesson_count,
      chapters_count,
    };
  }

  const { data: signedUrlData } = await supabase.storage
    .from(THUMBNAILS_BUCKET)
    .createSignedUrl(data.image_url, 3600);

  return {
    ...data,
    signedUrl: signedUrlData?.signedUrl || '',
    lesson_count,
    chapters_count,
  };
}
