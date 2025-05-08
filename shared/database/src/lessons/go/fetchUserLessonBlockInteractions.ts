import { getInteractionSchemaByType, type PluginTypeId } from '@gonasi/schemas/plugins';

import { getUserId } from '../../auth';
import type { TypedSupabaseClient } from '../../client';

interface FetchLessonBlockInteractionsParams {
  supabase: TypedSupabaseClient;
  lessonId: string;
}

/**
 * Fetches all block interactions for the currently authenticated user within a given lesson.
 *
 * @param {FetchLessonBlockInteractionsParams} params - Parameters for the fetch operation.
 * @param {TypedSupabaseClient} params.supabase - The Supabase client instance.
 * @param {string} params.lessonId - The ID of the lesson.
 * @returns {Promise<object[] | null>} - Returns an array of block interactions, or null on error.
 */
export async function fetchUserLessonBlockInteractions({
  supabase,
  lessonId,
}: FetchLessonBlockInteractionsParams) {
  const userId = await getUserId(supabase);
  if (!userId) {
    console.error('User ID could not be retrieved.');
    return [];
  }

  const { data, error } = await supabase
    .from('block_interactions')
    .select(
      `
        id,
        user_id,
        block_id,
        lesson_id,
        is_complete,
        score,
        attempts,
        state,
        last_response,
        feedback,
        started_at,
        completed_at,
        time_spent_seconds,
        blocks(plugin_type)
      `,
    )
    .match({
      user_id: userId,
      lesson_id: lessonId,
    });

  console.log('data: ', data);
  console.log('error: ', error);

  if (error || !data) {
    console.error(
      `Failed to fetch block interactions for lesson ID ${lessonId} and user ID ${userId}:`,
      error?.message ?? 'No data found',
    );
    return [];
  }

  const validatedInteractions = [];

  for (const interaction of data ?? []) {
    const pluginType = interaction.blocks?.plugin_type as PluginTypeId;

    const schema = getInteractionSchemaByType(pluginType);
    const result = schema.safeParse(interaction);

    if (!result.success) {
      console.warn(`Invalid interaction for block ID ${interaction.block_id}:`, result.error);
      return [];
    }

    validatedInteractions.push({
      ...interaction,
      plugin_type: pluginType,
      state: result.data,
    });
  }

  return validatedInteractions;
}
