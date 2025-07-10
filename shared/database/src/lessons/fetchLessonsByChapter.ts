import type { TypedSupabaseClient } from '../client';

interface FetchLessonsByChapterArgs {
  supabase: TypedSupabaseClient;
  chapterId: string;
  organizationId: string;
}

/**
 * Fetches lessons by chapter ID and organization ID.
 *
 * @param {FetchLessonsByChapterArgs} args - The input arguments.
 * @returns {Promise<Array<{ id: string; name: string; lesson_type_id: string }> | null>} The lessons data if found, otherwise `null`.
 */
export async function fetchLessonsByChapter({
  supabase,
  chapterId,
  organizationId,
}: FetchLessonsByChapterArgs) {
  // fetch chapter title and description
  const { data: chapterData, error: chapterError } = await supabase
    .from('chapters')
    .select('name, description')
    .match({ id: chapterId, organization_id: organizationId })
    .single();

  if (chapterError || !chapterData) {
    console.error('Failed to fetch chapter:', chapterError?.message || 'Chapter not found');
    return null;
  }

  const { data: lessonsData, error: lessonsError } = await supabase
    .from('lessons')
    .select(
      'id, name, lesson_type_id, lesson_types(name, description, lucide_icon, bg_color), position, chapter_id',
    )
    .match({ chapter_id: chapterId, organization_id: organizationId })
    .order('position', { ascending: true }); // ✅ Order from 0 → n

  if (lessonsError || !lessonsData) {
    console.error('Failed to fetch lessons:', lessonsError?.message || 'Lessons not found');
    return null;
  }

  return {
    chapter: chapterData,
    lessons: lessonsData,
  };
}
