import type z from 'zod';

import { UnifiedNavigationSchema } from '@gonasi/schemas/publish/unified-navigation';

import { getUserId } from '../../auth';
import type { TypedSupabaseClient } from '../../client';

type UnifiedNavigation = z.infer<typeof UnifiedNavigationSchema>;

interface GetUnifiedNavigationArgs {
  supabase: TypedSupabaseClient;
  courseId: string;
  blockId?: string;
  lessonId?: string;
  chapterId?: string;
}

/**
 * Fetches unified navigation metadata for the current block, lesson, or chapter context.
 * Returns metadata for current, previous, next, continue, completion, and course overview.
 */
export async function getUnifiedNavigation({
  supabase,
  courseId,
  blockId,
  lessonId,
  chapterId,
}: GetUnifiedNavigationArgs): Promise<UnifiedNavigation | null> {
  const userId = await getUserId(supabase);

  const { data, error } = await supabase.rpc('get_unified_navigation', {
    p_published_course_id: courseId,
    p_user_id: userId,
    p_current_block_id: blockId,
    p_current_lesson_id: lessonId,
    p_current_chapter_id: chapterId,
  });

  if (error) {
    console.error('[getUnifiedNavigation] Supabase RPC error:', error.message);
    return null;
  }

  if (!data) {
    console.warn(`[getUnifiedNavigation] No data returned for course ${courseId}`);
    return null;
  }

  const parsed = UnifiedNavigationSchema.safeParse(data);
  if (!parsed.success) {
    console.error('[getUnifiedNavigation] Invalid response schema:', parsed.error);
    return null;
  }

  return parsed.data;
}
