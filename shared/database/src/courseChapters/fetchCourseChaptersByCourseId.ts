import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';

/**
 * Fetches the course chapters by course ID and user ID, ordering chapters by position and lessons by created_at.
 *
 * @param {TypedSupabaseClient} supabase - The Supabase client instance.
 * @param {string} courseId - The ID of the course.
 * @returns {Promise<object[] | null>} The course chapters data or null if not found.
 */
export async function fetchCourseChaptersByCourseId(
  supabase: TypedSupabaseClient,
  courseId: string,
) {
  const userId = await getUserId(supabase);

  const { data, error } = await supabase
    .from('chapters')
    .select(
      `
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
          course_id, 
          chapter_id, 
          lesson_type_id,
          name,
          position,
          created_at, 
          updated_at,
          created_by, 
          updated_by, 
          settings, 
          lesson_types(
            id,
            name,
            description,
            lucide_icon,
            bg_color
          )
        )
      `,
      { count: 'exact' },
    )
    .match({ course_id: courseId, created_by: userId })
    .order('position', { ascending: true }) // ✅ Order chapters by position
    .order('position', { ascending: true, referencedTable: 'lessons' }); // ✅ Order lessons by position

  console.log('error: ', error);
  if (error || !data) {
    console.error('Error fetching course chapters:', error?.message ?? 'Chapters not found');
    return null;
  }

  // Add lesson count to each chapter
  const formattedData = data.map((chapter) => ({
    ...chapter,
    lesson_count: chapter.lessons?.length || 0,
  }));

  return formattedData;
}
