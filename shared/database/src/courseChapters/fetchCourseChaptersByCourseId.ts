import type { TypedSupabaseClient } from '../client';

/**
 * Fetches the course chapters by course ID, including number of lessons in each chapter.
 *
 * @param {TypedSupabaseClient} supabase - The Supabase client instance.
 * @param {string} courseId - The ID of the course.
 * @returns {Promise<object[] | null>} The course chapters data or null if not found.
 */
export async function fetchCourseChaptersByCourseId(
  supabase: TypedSupabaseClient,
  courseId: string,
) {
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
        lessons (
          id
        )
      `,
    )
    .match({ course_id: courseId })
    .order('position', { ascending: true })
    .order('position', { ascending: true, referencedTable: 'lessons' });

  if (error || !data) {
    console.error('Error fetching course chapters:', error?.message ?? 'Chapters not found');
    return null;
  }

  return data.map((chapter) => ({
    ...chapter,
    lesson_count: chapter.lessons?.length || 0,
  }));
}
