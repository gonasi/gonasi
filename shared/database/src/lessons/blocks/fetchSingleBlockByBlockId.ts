import type { PluginTypeId } from '@gonasi/schemas/plugins';

import type { TypedSupabaseClient } from '../../client';

export const fetchSingleBlockByBlockId = async (supabase: TypedSupabaseClient, blockId: string) => {
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

    return {
      success: true,
      message: 'Block fetched successfully.',
      data: {
        ...data,
        plugin_type: data.plugin_type as PluginTypeId,
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
