import type { PluginTypeId } from '@gonasi/schemas/plugins';

import type { TypedSupabaseClient } from '../../client';

/**
 * Fetches a published lesson by its ID, including associated blocks,
 * and casts each block's `plugin_type` to a known `PluginTypeId`.
 *
 * If the lesson is not found or there’s an error, `null` is returned.
 *
 * @param supabase - The typed Supabase client instance.
 * @param lessonId - The ID of the lesson to retrieve.
 * @returns The lesson with typed blocks, or `null` if not found or on error.
 */
export async function fetchValidatedPublishedLessonById(
  supabase: TypedSupabaseClient,
  lessonId: string,
) {
  const { data, error } = await supabase
    .from('lessons')
    .select(
      `
      id,
      course_id,
      chapter_id,
      lesson_type_id,
      name,
      position,
      created_at,
      updated_at,
      metadata,
      settings,
      blocks (
        id,
        lesson_id,
        plugin_type,
        position,
        content,
        weight,
        settings
      )
    `,
    )
    .eq('id', lessonId)
    .order('position', { ascending: true, referencedTable: 'blocks' })
    .single();

  if (error || !data) {
    console.error(
      `Failed to fetch lesson with ID ${lessonId}:`,
      error?.message ?? 'Lesson not found',
    );
    return null;
  }

  const validatedBlocks = (data.blocks ?? []).map((block) => ({
    ...block,
    plugin_type: block.plugin_type as PluginTypeId,
  }));

  return {
    ...data,
    blocks: validatedBlocks,
  };
}
