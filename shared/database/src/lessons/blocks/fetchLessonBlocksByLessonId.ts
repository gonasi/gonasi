import type { PluginTypeId } from '@gonasi/schemas/plugins';

import type { TypedSupabaseClient } from '../../client';

/**
 * Fetches lesson blocks associated with a given lesson ID from the Supabase 'blocks' table.
 *
 * @param {TypedSupabaseClient} supabase - An instance of the typed Supabase client.
 * @param {string} lessonId - The ID of the lesson whose blocks should be retrieved.
 * @returns {Promise<{
 *   success: boolean;
 *   message: string;
 *   data: Array<{
 *     id: string;
 *     plugin_type: string;
 *     content: any;
 *     settings: any;
 *     position: number;
 *     lesson_id: string;
 *     updated_by: string;
 *   }> | null;
 * }>} A promise that resolves to an object indicating success, a message, and the fetched data or null if failed.
 */
export const fetchLessonBlocksByLessonId = async (
  supabase: TypedSupabaseClient,
  lessonId: string,
) => {
  try {
    const { data, error } = await supabase
      .from('blocks')
      .select('id, plugin_type, content, settings, position, lesson_id, updated_by')
      .eq('lesson_id', lessonId)
      .order('position', { ascending: true });

    if (error || !data) {
      return {
        success: false,
        message: 'Unable to load lesson blocks.',
        data: null,
      };
    }

    const validatedData = data.map((block) => ({
      ...block,
      plugin_type: block.plugin_type as PluginTypeId,
    }));

    return {
      success: true,
      message: 'Lesson blocks retrieved successfully.',
      data: validatedData,
    };
  } catch (err) {
    console.error('Unexpected error in fetchLessonBlocksByLessonId:', err);
    return {
      success: false,
      message: 'Unexpected error occurred while loading lesson blocks.',
      data: null,
    };
  }
};
