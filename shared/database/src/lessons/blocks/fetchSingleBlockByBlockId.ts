import type { PluginTypeId } from '@gonasi/schemas/plugins';

import type { TypedSupabaseClient } from '../../client';

export const fetchSingleBlockByBlockId = async (supabase: TypedSupabaseClient, blockId: string) => {
  try {
    const { data, error } = await supabase
      .from('lesson_blocks')
      .select('id, plugin_type, content, settings')
      .eq('id', blockId)
      .single();

    if (error || !data) {
      console.error('Could not get block:', error);
      return {
        success: false,
        message: 'Couldn’t load that block.',
        data: null,
      };
    }

    return {
      success: true,
      message: 'Got the block!',
      data: {
        ...data,
        plugin_type: data.plugin_type as PluginTypeId,
      },
    };
  } catch (err) {
    console.error('Error grabbing block:', err);
    return {
      success: false,
      message: 'Something went wrong while loading the block.',
      data: null,
    };
  }
};
