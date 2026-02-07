import type { TypedSupabaseClient } from '../client';

interface FetchLiveSessionBlocksArgs {
  supabase: TypedSupabaseClient;
  liveSessionId: string;
  organizationId: string;
}

export async function fetchLiveSessionBlocks({
  supabase,
  liveSessionId,
  organizationId,
}: FetchLiveSessionBlocksArgs) {
  try {
    const { data, error } = await supabase
      .from('live_session_blocks')
      .select('id, plugin_type, content, settings, position, time_limit, status, difficulty')
      .eq('live_session_id', liveSessionId)
      .order('position', { ascending: true });

    if (error) {
      console.error('[fetchLiveSessionBlocks] error:', error);
      return {
        success: false,
        message: 'Failed to load live session blocks.',
        data: [],
      };
    }

    // const validatedBlocks = data
    //   ?.map((block, index) => {
    //     // Parse with required fields
    //     const parseResult = LiveSessionBuilderSchema.safeParse({
    //       plugin_type: block.plugin_type,
    //       content: block.content,
    //       settings: block.settings,
    //       organization_id: organizationId,
    //       live_session_id: liveSessionId,
    //     });

    //     if (!parseResult.success) {
    //       console.error(
    //         `Block ${index} validation failed (${block.plugin_type}):`,
    //         parseResult.error.format(),
    //       );
    //       console.error('Raw block:', JSON.stringify(block, null, 2));
    //       return null;
    //     }

    //     // Return block with validated plugin_type, content & settings
    //     return {
    //       ...block,
    //       plugin_type: parseResult.data.plugin_type,
    //       content: parseResult.data.content,
    //       settings: parseResult.data.settings,
    //     };
    //   })
    //   .filter(Boolean);

    // if (!validatedBlocks || validatedBlocks.length === 0) {
    //   return {
    //     success: false,
    //     message: 'Live session blocks validation failed.',
    //     data: [],
    //   };
    // }

    return {
      success: true,
      message: 'Live session blocks retrieved successfully.',
      data,
    };
  } catch (err) {
    console.error('Unexpected error in fetchLiveSessionBlocks:', err);
    return {
      success: false,
      message: 'Unexpected error occurred while loading live session blocks.',
      data: [],
    };
  }
}
