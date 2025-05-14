import type { PluginTypeId } from '@gonasi/schemas/plugins';
import { getContentSchemaByType, getSettingsSchemaByType } from '@gonasi/schemas/plugins';

import type { TypedSupabaseClient } from '../../client';

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
        message: 'Failed to fetch lesson blocks.',
        data: null,
      };
    }

    const parsedBlocks = [];

    for (const block of data) {
      const contentSchema = getContentSchemaByType(block.plugin_type as PluginTypeId);
      const parsedContent = contentSchema.safeParse(block.content);

      const settingsSchema = getSettingsSchemaByType(block.plugin_type as PluginTypeId);
      const parsedSettings = settingsSchema.safeParse(block.settings);

      if (!parsedContent.success) {
        return {
          success: false,
          message: `Invalid content schema for block ID ${block.id}.`,
          data: null,
        };
      }

      if (!parsedSettings.success) {
        return {
          success: false,
          message: `Invalid settings schema for block ID ${block.id}.`,
          data: null,
        };
      }

      parsedBlocks.push({
        ...block,
        plugin_type: block.plugin_type as PluginTypeId,
        content: parsedContent.data,
        settings: parsedSettings.data,
      });
    }

    return {
      success: true,
      message: 'Blocks fetched successfully.',
      data: parsedBlocks,
    };
  } catch (err) {
    console.error('Unexpected error in fetchLessonBlocksByLessonId:', err);
    return {
      success: false,
      message: 'An unexpected error occurred while fetching blocks.',
      data: null,
    };
  }
};
