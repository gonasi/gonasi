import type { LiveSessionBuilderSchemaTypes } from '@gonasi/schemas/liveSessions';
import { LiveSessionBuilderSchema } from '@gonasi/schemas/liveSessions';

import type { TypedSupabaseClient } from '../client';

interface FetchLiveSessionBlocksArgs {
  supabase: TypedSupabaseClient;
  liveSessionId: string;
  organizationId: string;
}

// Extend the validated block with database fields
export type LiveSessionBlock = LiveSessionBuilderSchemaTypes & {
  id: string;
  position: number;
  status: string;
};

interface FetchLiveSessionBlocksSuccess {
  success: true;
  message: string;
  data: LiveSessionBlock[];
}

interface FetchLiveSessionBlocksError {
  success: false;
  message: string;
  data: [];
}

type FetchLiveSessionBlocksResult = FetchLiveSessionBlocksSuccess | FetchLiveSessionBlocksError;

export async function fetchLiveSessionBlocks({
  supabase,
  liveSessionId,
  organizationId,
}: FetchLiveSessionBlocksArgs): Promise<FetchLiveSessionBlocksResult> {
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

    const validatedBlocks = data
      ?.map((block, index) => {
        // Parse with required fields
        const parseResult = LiveSessionBuilderSchema.safeParse({
          plugin_type: block.plugin_type,
          content: block.content,
          settings: block.settings,
          organization_id: organizationId,
          live_session_id: liveSessionId,
          difficulty: block.difficulty,
          time_limit: block.time_limit,
        });

        if (!parseResult.success) {
          console.error(
            `Block ${index} validation failed (${block.plugin_type}):`,
            parseResult.error.format(),
          );
          console.error('Raw block:', JSON.stringify(block, null, 2));
          return null;
        }

        // Return block with validated plugin_type, content & settings
        return {
          ...parseResult.data,
          id: block.id,
          position: block.position,
          status: block.status,
        } as LiveSessionBlock;
      })
      .filter((block): block is LiveSessionBlock => block !== null);

    if (!validatedBlocks || validatedBlocks.length === 0) {
      return {
        success: false,
        message: 'Live session blocks validation failed.',
        data: [],
      };
    }

    return {
      success: true,
      message: 'Live session blocks retrieved successfully.',
      data: validatedBlocks,
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
