import {
  PublishedLessonWithProgressiveRevealSchema,
  type PublishedLessonWithProgressiveRevealSchemaTypes,
} from '@gonasi/schemas/publish';

import type { TypedSupabaseClient } from '../client';

interface FetchPublishedLessonBlocksArgs {
  supabase: TypedSupabaseClient;
  courseId: string;
  chapterId: string;
  lessonId: string;
  revealMode?: 'progressive' | 'all' | 'linear';
}

/**
 * Fetches published lesson blocks with progressive reveal functionality
 * Returns enhanced lesson data with visibility states and progress tracking
 */
export async function fetchPublishedLessonBlocksWithProgress({
  supabase,
  courseId,
  chapterId,
  lessonId,
}: FetchPublishedLessonBlocksArgs): Promise<PublishedLessonWithProgressiveRevealSchemaTypes | null> {
  const { data, error } = await supabase.rpc('get_user_lesson_blocks_progress', {
    p_course_id: courseId,
    p_chapter_id: chapterId,
    p_lesson_id: lessonId,
  });

  if (error) {
    console.error('❌ Supabase RPC error:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    return null;
  }

  // Debug raw response
  console.log('📦 Raw data returned from RPC:', JSON.stringify(data, null, 2));

  // If the function returned an internal error object
  if (data && typeof data === 'object' && 'error' in data) {
    console.error('❌ Database function returned application-level error:', data.error);
    return null;
  }

  // Attempt parsing with Zod
  const enhancedResult = PublishedLessonWithProgressiveRevealSchema.safeParse(data);

  if (enhancedResult.success) {
    console.log('✅ Successfully parsed lesson data with progressive reveal schema');
    return enhancedResult.data;
  } else {
    console.error('❌ Zod validation failed for progressive reveal schema');
    console.error('🧩 Validation issues:', enhancedResult.error.format());
    console.error('🔍 Full data that failed parsing:', JSON.stringify(data, null, 2));
  }

  return null;
}
