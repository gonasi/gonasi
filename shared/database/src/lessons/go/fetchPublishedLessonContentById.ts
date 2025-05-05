import { getUserId } from '../../auth';
import type { TypedSupabaseClient } from '../../client';
import type { LessonData, LessonProgress } from './types';

/**
 * Fetches a published lesson by ID, including user-specific progress (node_progress).
 */
export async function fetchPublishedLessonContentById(
  supabase: TypedSupabaseClient,
  lessonId: string,
): Promise<LessonData | null> {
  const userId = await getUserId(supabase);

  const { data, error } = await supabase
    .from('lessons')
    .select(
      `
      id, 
      course_id,
      chapter_id, 
      name,   
      content,
      created_at, 
      updated_at,
      lessons_progress!lessons_progress_lesson_id_fkey (
        id, user_id, node_progress, is_complete, updated_at
      )
    `,
    )
    .eq('id', lessonId)
    .eq('lessons_progress.user_id', userId)
    .single();

  if (error || !data) {
    console.error('Error fetching lesson:', error?.message || 'Lesson not found');
    return null;
  }

  const rawProgress = Array.isArray(data.lessons_progress) ? data.lessons_progress[0] : null;

  return {
    ...data,
    lessons_progress: rawProgress as LessonProgress | null,
  };
}
