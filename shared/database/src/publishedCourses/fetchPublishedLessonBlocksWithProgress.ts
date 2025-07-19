import {
  PublishedLessonWithProgressSchema,
  type PublishedLessonWithProgressSchemaTypes,
} from '@gonasi/schemas/publish';

import type { TypedSupabaseClient } from '../client';

interface FetchPublishedLessonBlocksArgs {
  supabase: TypedSupabaseClient;
  courseId: string;
  chapterId: string;
  lessonId: string;
}

export async function fetchPublishedLessonBlocksWithProgress({
  supabase,
  courseId,
  chapterId,
  lessonId,
}: FetchPublishedLessonBlocksArgs): Promise<PublishedLessonWithProgressSchemaTypes | null> {
  const { data, error } = await supabase.rpc('get_published_lesson_blocks_with_progress', {
    p_course_id: courseId,
    p_chapter_id: chapterId,
    p_lesson_id: lessonId,
  });

  if (error) {
    console.error('❌ Failed to fetch lesson blocks:', error);
    return null;
  }

  const result = PublishedLessonWithProgressSchema.safeParse(data);

  if (!result.success) {
    console.error('❌ Lesson data validation failed:', result.error.format());
    return null;
  }

  return result.data;
}
