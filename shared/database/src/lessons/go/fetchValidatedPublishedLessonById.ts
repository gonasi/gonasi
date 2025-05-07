import type { PluginTypeId } from '@gonasi/schemas/plugins';
import { getContentSchemaByType } from '@gonasi/schemas/plugins';

import type { TypedSupabaseClient } from '../../client';

/**
 * Fetches a published lesson by ID, including its blocks,
 * and validates each block's content against the appropriate plugin schema.
 *
 * If any block fails schema validation, the function returns `null`.
 *
 * @param supabase - A typed Supabase client instance.
 * @param lessonId - The ID of the lesson to fetch.
 * @returns The lesson data with parsed block content, or `null` if not found or validation fails.
 */
export async function fetchValidatedPublishedLessonById(
  supabase: TypedSupabaseClient,
  lessonId: string,
) {
  // Fetch the lesson and its associated blocks
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
        weight
      )
    `,
    )
    .eq('id', lessonId)
    .single();

  // Handle error or missing lesson
  if (error || !data) {
    console.error(
      `Failed to fetch lesson with ID ${lessonId}:`,
      error?.message ?? 'Lesson not found',
    );
    return null;
  }

  const validatedBlocks = [];

  // Validate and parse each block's content based on its plugin type
  for (const block of data.blocks ?? []) {
    const pluginType = block.plugin_type as PluginTypeId;
    const schema = getContentSchemaByType(pluginType);
    const result = schema.safeParse(block.content);

    // Abort if any block has invalid content
    if (!result.success) {
      console.warn(`Invalid block content for block ID ${block.id}:`, result.error);
      return null;
    }

    validatedBlocks.push({
      ...block,
      plugin_type: pluginType,
      content: result.data,
    });
  }

  // Return lesson data with validated and parsed blocks
  return {
    ...data,
    blocks: validatedBlocks,
  };
}
