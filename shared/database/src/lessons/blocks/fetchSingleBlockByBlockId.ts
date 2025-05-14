import type { z } from 'zod';

import type { PluginTypeId } from '@gonasi/schemas/plugins';
import { getContentSchemaByType, getSettingsSchemaByType } from '@gonasi/schemas/plugins';

import type { TypedSupabaseClient } from '../../client';

export const fetchSingleBlockByBlockId = async (
  supabase: TypedSupabaseClient,
  blockId: string,
): Promise<
  | {
      success: true;
      message: string;
      data: {
        id: string;
        plugin_type: PluginTypeId;
        content: z.infer<ReturnType<typeof getContentSchemaByType>>;
        settings: z.infer<ReturnType<typeof getSettingsSchemaByType>>;
      };
    }
  | {
      success: false;
      message: string;
      data: null;
    }
> => {
  try {
    const { data, error } = await supabase
      .from('blocks')
      .select('id, plugin_type, content, settings')
      .eq('id', blockId)
      .single();

    if (error || !data) {
      console.error('Failed to fetch block: ', error);
      return {
        success: false,
        message: 'Failed to fetch the block.',
        data: null,
      };
    }

    const contentSchema = getContentSchemaByType(data.plugin_type as PluginTypeId);
    const settingsSchema = getSettingsSchemaByType(data.plugin_type as PluginTypeId);

    const parsedContent = contentSchema.safeParse(data.content);
    const parsedSettings = settingsSchema.safeParse(data.settings);

    if (!parsedContent.success) {
      return {
        success: false,
        message: 'Wrong content schema.',
        data: null,
      };
    }

    if (!parsedSettings.success) {
      return {
        success: false,
        message: 'Wrong settings schema.',
        data: null,
      };
    }

    return {
      success: true,
      message: 'Block fetched successfully.',
      data: {
        id: data.id,
        plugin_type: data.plugin_type as PluginTypeId,
        content: parsedContent.data,
        settings: parsedSettings.data,
      },
    };
  } catch (err) {
    console.error('Unexpected error in fetchSingleBlockByBlockId:', err);
    return {
      success: false,
      message: 'An unexpected error occurred while fetching the block.',
      data: null,
    };
  }
};
