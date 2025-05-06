import type { PluginTypeId } from '@gonasi/schemas/plugins';
import { getContentSchemaByType } from '@gonasi/schemas/plugins';

import type { TypedSupabaseClient } from '../../client';

export const fetchSingleBlockByBlockId = async (supabase: TypedSupabaseClient, blockId: string) => {
  try {
    const { data, error } = await supabase
      .from('blocks')
      .select('id, plugin_type, content')
      .eq('id', blockId)
      .single(); // Ensures only one row is returned

    if (error) {
      return {
        success: false,
        message: 'Failed to fetch the block.',
        data: null,
      };
    }

    const contentSchema = getContentSchemaByType(data.plugin_type as PluginTypeId);
    const parsedContent = contentSchema.safeParse(data.content);

    if (!parsedContent.success) {
      return {
        success: false,
        message: 'Wrong content schema.',
        data: null,
      };
    }
    return {
      success: true,
      message: 'Block fetched successfully.',
      data: {
        ...data,
        plugin_type: data.plugin_type as PluginTypeId,
        content: parsedContent.data,
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
