import type { TypedSupabaseClient } from '../client';

interface FetchPublishedLessonBlocksArgs {
  supabase: TypedSupabaseClient;
  courseId: string;
  chapterId: string;
  lessonId: string;
}

export async function fetchPublishedLessonBlocks({
  supabase,
  courseId,
  chapterId,
  lessonId,
}: FetchPublishedLessonBlocksArgs) {
  const { data, error } = await supabase.rpc('get_published_lesson_blocks', {
    p_course_id: courseId,
    p_chapter_id: chapterId,
    p_lesson_id: lessonId,
  });

  if (error) {
    console.error('Failed to fetch lesson blocks:', error);
    return null;
  }

  return data;
}
